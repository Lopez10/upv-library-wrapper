const cargaCatalunya = require("../wrapper/cat");
const cargarCv = require("../wrapper/cv2");
const cargarEus = require("../wrapper/eus");
const { con } = require("../bd");

const cargarProvincia = async (provincia) => {
  for (let i = 0; i < provincia.length; i++) {
    if (provincia[i] === "cv") await cargarCv();
    else if (provincia[i] === "eus") cargarEus();
    else if (provincia[i] === "cat") cargaCatalunya();
  }
};

const busquedaPorNombre = async ({ localidad, cp, provincia, tipo }) => {
  console.log(provincia);
  let findQuery = 'SELECT * from biblioteca WHERE tipo = "' + tipo + '"';

  if (cp !== undefined) {
    findQuery += " AND codigoPostal = " + parseInt(cp);
  }

  if (localidad !== undefined && provincia !== undefined) {
    findQuery +=
      ' AND id_localidad IN (SELECT id_localidad FROM localidad WHERE nombre = "' +
      localidad +
      '"';
    findQuery +=
      ' AND id_provincia IN (SELECT id_provincia FROM provincia WHERE nombre = "' +
      provincia +
      '"))';
  } else {
    if (localidad !== undefined) {
      findQuery +=
        ' AND id_localidad IN (SELECT id_localidad FROM localidad WHERE nombre = "' +
        localidad +
        '")';
    }
    if (provincia !== undefined) {
      findQuery +=
        ' AND id_localidad IN (SELECT id_localidad FROM localidad WHERE id_provincia IN (SELECT id_provincia FROM provincia WHERE nombre = "' +
        provincia +
        '"))';
    }
  }
  findQuery += ";";

  let result = await con.awaitQuery(findQuery);
  return result;
};

module.exports = { cargarProvincia, busquedaPorNombre };
