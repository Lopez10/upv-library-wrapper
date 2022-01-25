const express = require("express");
const {
  cargarProvincia,
  busquedaPorNombre,
} = require("../functions/cargarProvincias");
const router = express.Router();

router.get("/", function (req, res) {
  res.send("respond with a resource");
});

router.post("/provincias", async (req, res) => {
  await cargarProvincia(req.body);
  res.send("Cargado correctamente");
  // res.render("index", {
  //   title: req.body.provincia,
  //   message: `${req.body.provincia} ha sido cargada con exito`,
  // });
});

router.get("/busqueda", async (req, res) => {
  console.log(req.query);
  let data = req.query;
  let result = await busquedaPorNombre(data);
  // res.header("Access-Control-Allow-Origin", "*");
  // res.header(
  //   "Access-Control-Allow-Headers",
  //   "Origin, X-Requested-With, Content-Type, Accept"
  // );
  res.send(result);
});
module.exports = router;
