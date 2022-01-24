const fs = require("fs");
const parser = require("xml2json");
const { con } = require("../bd");

const creacionInsertProvincia = async (fichero) => {
  let insertProvincia =
    "INSERT INTO provincia (nombre, codigo) VALUES ('Barcelona', 08), ('Gerona', 17)";
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
      if (fichero[i].poblacio == localidades[j].nombre) {
        contadorLocalidades++;
      }
    }

    // Construccion del string
    if (contadorLocalidades == 0) {
      for (let k = 0; k < provincias.length; k++) {
        // creacion del objeto para evitar duplicados
        if (
          fichero[i].cpostal.substr(0, 2) == provincias[k].codigo ||
          fichero[i].cpostal.substr(1, 1) == provincias[k].codigo
        ) {
          localidades.push({
            id_provincia: provincias[k].id_provincia,
            nombre: fichero[i].poblacio,
            codigo: fichero[i].codi_municipi.substr(
              3,
              fichero[i].codi_municipi.length
            ),
          });
          // Creacion del string
          insertLocalidad += `(${
            localidades[localidades.length - 1].id_provincia
          }, "${localidades[localidades.length - 1].nombre}", ${
            localidades[localidades.length - 1].codigo
          }),`;
        }
      }
    }
  }

  insertLocalidad = insertLocalidad.substring(0, insertLocalidad.length - 1);
  await con.awaitQuery(insertLocalidad);
};

const creacionInsertBiblioteca = async (fichero) => {
  let contador = 0;
  let localidades = await con.awaitQuery("SELECT * FROM `localidad`");
  let bibliotecas = [];
  let insertBiblioteca =
    "INSERT INTO biblioteca (codigoPostal, descripcion, email, id_localidad, latitud, longitud, nombre, telefono, tipo, direccion) VALUES ";
  for (let i = 0; i < fichero.length; i++) {
    // Construccion del string
    for (let k = 0; k < localidades.length; k++) {
      if (fichero[i].poblacio == localidades[k].nombre) {
        bibliotecas.push({
          id_localidad: localidades[k].id_localidad,
          codigoPostal: fichero[i].cpostal,
          descripcion: fichero[i].nom.replace('"', "").replace('"', ""),
          email: fichero[i].email,
          latitud: fichero[i].latitud,
          tipo:
            typeof fichero[i].propietats !== "undefined"
              ? fichero[i].propietats.toString().indexOf("Privada") !== -1
                ? "Privada"
                : "Publica"
              : "Publica",
          tipo2: fichero[i].propietats,
          longitud: fichero[i].longitud,
          telefono:
            typeof fichero[i].telefon1 !== "undefined"
              ? fichero[i].telefon1
                  .replace(/ /g, "")
                  .replace("/", "")
                  .substring(0, 9)
              : "0",
          nombre: fichero[i].nom.replace('"', "").replace('"', ""),
          direccion: fichero[i].via,
        });
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

  con.awaitQuery(insertBiblioteca);
};

const lanzaderaCat = () => {
  let consultaPreviaCAT = con.awaitQuery(
    "SELECT * FROM `provincia` WHERE `nombre` = 'Barcelona'"
  );
  consultaPreviaCAT.then((data) => {
    if (data[0] == undefined) {
      // Parse
      const lecturaXML = (direccion) => {
        let data = fs.readFileSync(direccion, "utf8");
        return data;
      };

      let cat = lecturaXML("./static/Archivos_demo/CAT.xml");

      let json = parser.toJson(cat);
      json = JSON.parse(json);

      creacionInsertProvincia(json.response.row).then(() => {
        creacionInsertLocalidad(json.response.row).then(() => {
          creacionInsertBiblioteca(json.response.row);
        });
      });
    } else {
      console.log("La base de datos de Catalunya ya esta cargada");
    }
  });
};

module.exports = lanzaderaCat;
