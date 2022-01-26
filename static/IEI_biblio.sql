DROP DATABASE IEI;
CREATE DATABASE IEI;
USE IEI;

CREATE TABLE provincia(
	id_provincia INT AUTO_INCREMENT,
	nombre VARCHAR(150) NOT NULL,
	codigo VARCHAR(2) NOT NULL,
	PRIMARY KEY(id_provincia)
);

CREATE TABLE localidad(
	id_localidad INT AUTO_INCREMENT,
	id_provincia INT NOT NULL,
	nombre VARCHAR(150) NOT NULL,
	codigo VARCHAR(5) NOT NULL,
	PRIMARY KEY(id_localidad),
	FOREIGN KEY(id_provincia) REFERENCES provincia(id_provincia)
);

CREATE TABLE biblioteca (
	id_biblioteca INT AUTO_INCREMENT,
	id_localidad INT NOT NULL,
	nombre VARCHAR(150) NOT NULL,
	tipo VARCHAR(10) NOT NULL,
	direccion VARCHAR(300) NOT NULL,
	codigoPostal CHAR(5) NOT NULL,
	longitud DOUBLE, 
	latitud DOUBLE,
	telefono VARCHAR(9),
	email VARCHAR(120),
	descripcion VARCHAR(600),
	PRIMARY KEY(id_biblioteca),
	FOREIGN KEY(id_localidad) REFERENCES localidad(id_localidad)
);