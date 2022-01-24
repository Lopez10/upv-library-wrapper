const { con } = require("../bd");
require("chromedriver");
const { Builder, By } = require("selenium-webdriver");
let driver;
const csvtojson = require("csvtojson");

// Inserts
const creacionInsertProvincia = async (fichero) => {
  let insertProvincia = "INSERT INTO provincia (nombre, codigo) VALUES ";
  let provincias = [];

  for (let i = 0; i < fichero.length; i++) {
    let contadorProvincias = 0;

    for (let j = 0; j < provincias.length; j++) {
      if (fichero[i].COD_PROVINCIA == provincias[j].codigo) {
        contadorProvincias++;
      }
    }
    if (contadorProvincias == 0) {
      provincias.push({
        nombre: fichero[i].NOM_PROVINCIA,
        codigo: fichero[i].COD_PROVINCIA,
      });
      insertProvincia += `("${fichero[i].NOM_PROVINCIA}", ${fichero[i].COD_PROVINCIA}),`;
    }
  }

  insertProvincia = insertProvincia.substring(0, insertProvincia.length - 1);
  await con.awaitQuery(insertProvincia);
};

const creacionInsertLocalidad = async (fichero) => {
  let insertLocalidad =
    "INSERT INTO localidad (id_provincia, nombre , codigo) VALUES ";
  let localidades = [];
  let provincias = await con.awaitQuery("SELECT * FROM `provincia`");
  for (let i = 0; i < fichero.length; i++) {
    let contadorLocalidades = 0;

    // Buscar duplicados
    for (let j = 0; j < localidades.length; j++) {
      if (fichero[i].NOM_MUNICIPIO == localidades[j].nombre) {
        contadorLocalidades++;
      }
    }

    // Construccion del string
    if (contadorLocalidades == 0) {
      for (let k = 0; k < provincias.length; k++) {
        if (contadorLocalidades == 0) {
          // creacion del objeto para evitar duplicados
          if (fichero[i].NOM_PROVINCIA == provincias[k].nombre) {
            localidades.push({
              id_provincia: provincias[k].id_provincia,
              nombre: fichero[i].NOM_MUNICIPIO,
              codigo: fichero[i].COD_MUNICIPIO,
            });
            // Creacion del string
            insertLocalidad += `(${provincias[k].id_provincia}, "${fichero[i].NOM_MUNICIPIO}", ${fichero[i].COD_MUNICIPIO}),`;
            contadorLocalidades++;
          }
        }
      }
    }
  }
  insertLocalidad = insertLocalidad.substring(0, insertLocalidad.length - 1);
  await con.awaitQuery(insertLocalidad);
};

const creacionInsertBiblioteca = async (fichero) => {
  let localidades = await con.awaitQuery("SELECT * FROM `localidad`");
  let bibliotecas = [];
  let contador = 0;
  let insertBiblioteca =
    "INSERT INTO biblioteca (codigoPostal, descripcion, email, id_localidad, latitud, longitud, nombre, telefono, tipo, direccion) VALUES ";
  for (let i = 0; i < fichero.length; i++) {
    // Construccion del string
    for (let k = 0; k < localidades.length; k++) {
      let latitud = 0;
      let longitud = 0;
      // creacion del objeto para evitar duplicados
      if (fichero[i].NOM_MUNICIPIO == localidades[k].nombre) {
        try {
          let direccion = driver.findElement(By.id("address"));
          await direccion.clear();

          await direccion.sendKeys(
            `${fichero[i].DIRECCION}, ${fichero[i].NOM_PROVINCIA}`
          );

          await driver.findElement(By.className("btn")).click();

          // Obtenemos el texto de la provincia
          latitud = await driver
            .findElement(By.id("latitude"))
            .getAttribute("value");
          longitud = await driver
            .findElement(By.id("longitude"))
            .getAttribute("value");
        } catch (error) {
          contador++;
          await driver
            .switchTo()
            .alert()
            .then(() => {
              alert.accept();
            })
            .catch((err) => {});
        }
        bibliotecas.push({
          id_localidad: localidades[k].id_localidad,
          codigoPostal: fichero[i].CP,
          descripcion: fichero[i].NOMBRE.replace(/"/g, ""),
          email: fichero[i].EMAIL.toLowerCase(),
          latitud: latitud || 0,
          tipo: fichero[i].DESC_CARACTER,
          longitud: longitud || 0,
          telefono:
            fichero[i].TELEFONO != ""
              ? fichero[i].TELEFONO.substring(5, 14).indexOf(".") == -1
                ? fichero[i].TELEFONO.substring(5, 14).replace(/ /g, "")
                : 0
              : 0,
          nombre: fichero[i].NOMBRE.replace(/"/g, ""),
          direccion: fichero[i].DIRECCION.replace(/"/g, ""),
        });
        // Creacion del string
        insertBiblioteca += `(${
          bibliotecas[bibliotecas.length - 1].codigoPostal
        }, "${bibliotecas[bibliotecas.length - 1].descripcion}", "${
          bibliotecas[bibliotecas.length - 1].email
        }", ${bibliotecas[bibliotecas.length - 1].id_localidad}, ${
          bibliotecas[bibliotecas.length - 1].latitud
        }, ${bibliotecas[bibliotecas.length - 1].longitud}, "${
          bibliotecas[bibliotecas.length - 1].nombre
        }", ${bibliotecas[bibliotecas.length - 1].telefono}, "${
          bibliotecas[bibliotecas.length - 1].tipo
        }", "${bibliotecas[bibliotecas.length - 1].direccion}"),`;
      }
    }
  }

  insertBiblioteca = insertBiblioteca.substring(0, insertBiblioteca.length - 1);
  await con.awaitQuery(insertBiblioteca);
};

const lanzaderaCv = async () => {
  const csvFilePath = "./static/Archivos_demo/CV.csv";
  const consultaPreviaCV = con.awaitQuery(
    "SELECT * FROM `provincia` WHERE `nombre` = 'VALENCIA'"
  );
  consultaPreviaCV.then((dataConsulta) => {
    if (dataConsulta[0] == undefined) {
      driver = new Builder().forBrowser("chrome").build();
      driver.get("https://www.coordenadas-gps.com");
      driver.executeScript("window.scroll(0, 1000)");

      const converter = csvtojson({ delimiter: ";" });

      converter.fromFile(csvFilePath).then((data) => {
        creacionInsertProvincia(data).finally(() => {
          creacionInsertLocalidad(data).finally(() => {
            creacionInsertBiblioteca(data).finally(() => {
              driver.close();
            });
          });
        });
      });
    } else {
      console.log(
        "Las bibliotecas de la Comunidad Valenciana han sido cargadas"
      );
    }
  });
};

module.exports = lanzaderaCv;
