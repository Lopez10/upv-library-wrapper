const fs = require("fs");
const { con } = require("../bd");

const lecturaJSON = (direccion) => {
  let data = fs.readFileSync(direccion, "utf8");
  return JSON.parse(data);
};

const creacionInsertProvincia = async (fichero) => {
  let insertProvincia = "INSERT INTO provincia (nombre, codigo) VALUES ";
  let provincias = [];

  for (let i = 0; i < fichero.length; i++) {
    let contadorProvincias = 0;
    for (let j = 0; j < provincias.length; j++) {
      if (fichero[i].territory == provincias[j].nombre) {
        contadorProvincias++;
      }
    }
    if (contadorProvincias == 0) {
      provincias.push({
        nombre: fichero[i].territory,
        codigo: fichero[i].postalcode.substr(0, 2),
      });
      insertProvincia += `("${fichero[i].territory}", ${fichero[
        i
      ].postalcode.substr(0, 2)}),`;
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
      if (fichero[i].municipality == localidades[j].nombre) {
        contadorLocalidades++;
      }
    }

    // Construccion del string
    for (let k = 0; k < provincias.length; k++) {
      if (contadorLocalidades == 0) {
        // creacion del objeto para evitar duplicados
        if (fichero[i].territory == provincias[k].nombre) {
          localidades.push({
            id_provincia: provincias[k].id_provincia,
            nombre: fichero[i].municipality,
            codigo: fichero[i].postalcode.replace(".", ""),
          });
          // Creacion del string
          insertLocalidad += `(${
            localidades[localidades.length - 1].id_provincia
          }, "${localidades[localidades.length - 1].nombre}", ${localidades[
            localidades.length - 1
          ].codigo.substring(
            1,
            localidades[localidades.length - 1].codigo.length - 1
          )}),`;
          contadorLocalidades++;
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
  let insertBiblioteca =
    "INSERT INTO biblioteca (codigoPostal, descripcion, email, id_localidad, latitud, longitud, nombre, telefono, tipo, direccion) VALUES ";
  for (let i = 0; i < fichero.length; i++) {
    let contadorBibliotecas = 0;

    // Buscar duplicados
    for (let j = 0; j < bibliotecas.length; j++) {
      if (fichero[i].documentName == bibliotecas[j].nombre) {
        contadorBibliotecas++;
      }
    }

    // Construccion del string
    for (let k = 0; k < localidades.length; k++) {
      if (contadorBibliotecas == 0) {
        // creacion del objeto para evitar duplicados
        if (fichero[i].municipality == localidades[k].nombre) {
          bibliotecas.push({
            id_localidad: localidades[k].id_localidad,
            codigoPostal: fichero[i].postalcode.replace(".", ""),
            descripcion: fichero[i].documentDescription,
            email: fichero[i].email,
            latitud: fichero[i].latwgs84,
            tipo:
              fichero[i].documentDescription.indexOf("privada") !== -1
                ? "privada"
                : "publica",
            longitud: fichero[i].lonwgs84,
            telefono:
              fichero[i].phone.replace(/ /g, "").length > 9
                ? fichero[i].phone.replace(/ /g, "").substring(0, 9)
                : fichero[i].phone.length === 0
                ? 0
                : fichero[i].phone.replace(/ /g, ""),
            nombre: fichero[i].documentName,
            direccion: fichero[i].address,
          });

          // Creacion del string
          insertBiblioteca += `(${
            bibliotecas[bibliotecas.length - 1].codigoPostal
          },'${bibliotecas[bibliotecas.length - 1].descripcion}', '${
            bibliotecas[bibliotecas.length - 1].email
          }', ${bibliotecas[bibliotecas.length - 1].id_localidad}, ${
            bibliotecas[bibliotecas.length - 1].latitud
          }, ${bibliotecas[bibliotecas.length - 1].longitud}, '${
            bibliotecas[bibliotecas.length - 1].nombre
          }', ${bibliotecas[bibliotecas.length - 1].telefono}, '${
            bibliotecas[bibliotecas.length - 1].tipo
          }', '${bibliotecas[bibliotecas.length - 1].direccion}'),`;

          contadorBibliotecas++;
        }
      }
    }
  }

  insertBiblioteca = insertBiblioteca.substring(0, insertBiblioteca.length - 1);

  await con.awaitQuery(insertBiblioteca);
};

const lanzaderaEus = () => {
  let eus = lecturaJSON("./static/Archivos_demo/EUS.json");
  const consultaPreviaEUS = con.awaitQuery(
    "SELECT * FROM `provincia` WHERE `nombre` = 'Gipuzkoa' "
  );
  consultaPreviaEUS.then((data) => {
    if (data[0] == undefined) {
      creacionInsertProvincia(eus).finally(() => {
        creacionInsertLocalidad(eus).finally(() => {
          creacionInsertBiblioteca(eus);
        });
      });
    } else {
      console.log("La base de datos de Euskadi ya está cargada");
    }
  });
};

module.exports = lanzaderaEus;
