-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 04-02-2025 a las 20:57:31
-- Versión del servidor: 10.4.28-MariaDB
-- Versión de PHP: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `MAIRA`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `amigos`
--

CREATE TABLE `amigos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `amigo_id` int(11) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `amigos`
--

INSERT INTO `amigos` (`id`, `usuario_id`, `amigo_id`, `fecha_creacion`) VALUES
(40, 1, 2, '2024-10-09 20:47:30'),
(41, 1, 7, '2024-10-10 13:39:49'),
(42, 7, 1, '2024-10-10 13:42:36'),
(43, 2, 1, '2024-10-12 04:32:41'),
(44, 2, 8, '2024-10-25 15:36:58'),
(45, 10, 2, '2024-10-28 14:05:23');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `animals`
--

CREATE TABLE `animals` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` varchar(50) NOT NULL,
  `capacity_personal` int(11) DEFAULT NULL,
  `cargo_capacity` varchar(50) DEFAULT NULL,
  `mobility_road` decimal(5,2) DEFAULT NULL,
  `mobility_offroad` decimal(5,2) DEFAULT NULL,
  `mobility_forest` decimal(5,2) DEFAULT NULL,
  `mobility_mountain` decimal(5,2) DEFAULT NULL,
  `mobility_urban` decimal(5,2) DEFAULT NULL,
  `mobility_desert` decimal(5,2) DEFAULT NULL,
  `mobility_snow` decimal(5,2) DEFAULT NULL,
  `mobility_swamp` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `animals`
--

INSERT INTO `animals` (`id`, `name`, `type`, `capacity_personal`, `cargo_capacity`, `mobility_road`, `mobility_offroad`, `mobility_forest`, `mobility_mountain`, `mobility_urban`, `mobility_desert`, `mobility_snow`, `mobility_swamp`) VALUES
(1, 'Caballo de Guerra', 'Caballo', 1, '200 kg', 1.00, 0.90, 0.80, 0.70, 0.80, 0.60, 0.50, 0.40),
(2, 'Mula de Carga', 'Mula', 1, '400 kg', 1.00, 0.80, 0.70, 0.60, 0.70, 0.50, 0.40, 0.30);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `armamento`
--

CREATE TABLE `armamento` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `calibre` varchar(20) DEFAULT NULL,
  `alcance_efectivo` int(11) DEFAULT NULL,
  `alcance_maximo` int(11) DEFAULT NULL,
  `cadencia_de_tiro` int(11) DEFAULT NULL,
  `peso` decimal(10,2) DEFAULT NULL,
  `municion_calibre` varchar(50) DEFAULT NULL,
  `municion_tipoA` varchar(50) DEFAULT NULL,
  `municion_tipoB` varchar(50) DEFAULT NULL,
  `municion_tipoC` varchar(50) DEFAULT NULL,
  `municion_tipoD` varchar(50) DEFAULT NULL,
  `capacidad_cargador` int(11) DEFAULT NULL,
  `cantidad_cargadores` int(11) DEFAULT NULL,
  `daño_contra` varchar(255) DEFAULT NULL,
  `radio_accion` int(11) DEFAULT NULL,
  `efectivo_contra` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `armamento`
--

INSERT INTO `armamento` (`id`, `nombre`, `tipo`, `calibre`, `alcance_efectivo`, `alcance_maximo`, `cadencia_de_tiro`, `peso`, `municion_calibre`, `municion_tipoA`, `municion_tipoB`, `municion_tipoC`, `municion_tipoD`, `capacidad_cargador`, `cantidad_cargadores`, `daño_contra`, `radio_accion`, `efectivo_contra`) VALUES
(1, 'FAL', 'Fusil', '7.62 mm', 400, 600, 700, 4.40, '7.62 mm', 'Común', 'Trazante', 'Perforante', NULL, 20, 5, 'Infantería, vehículos ligeros', NULL, 'Personal, vehículos ligeros'),
(2, 'SK 105', 'Tanque', '105 mm', 1500, 2000, 6, 17700.00, '105 mm', 'Explosiva', 'Carga hueca', NULL, NULL, NULL, 41, 'Tanques, vehículos ligeros', 25, 'Vehículos blindados, fortificaciones'),
(3, 'TAM', 'Tanque', '105 mm', 2500, 3000, 6, 30500.00, '105 mm', 'Explosiva', 'Carga hueca', 'Flecha', NULL, NULL, 50, 'Tanques, vehículos ligeros', 25, 'Vehículos blindados, fortificaciones'),
(4, 'Mortero 120 mm', 'Mortero', '120 mm', 4000, 7000, 12, 160.00, '120 mm', 'HE', 'Humo', 'Iluminación', NULL, NULL, 30, 'Infantería, posiciones fortificadas', 50, 'Personal, fortificaciones ligeras'),
(5, 'Mortero 81 mm', 'Mortero', '81 mm', 3200, 5700, 20, 60.00, '81 mm', 'HE', 'Humo', 'Iluminación', NULL, NULL, 40, 'Infantería, posiciones fortificadas', 35, 'Personal, fortificaciones ligeras'),
(6, 'Mortero 60 mm', 'Mortero', '60 mm', 1500, 3500, 30, 20.00, '60 mm', 'HE', 'Humo', 'Iluminación', NULL, NULL, 50, 'Infantería, posiciones fortificadas', 20, 'Personal'),
(7, 'Cañón Oto Melara', 'Artillería', '155 mm', 18000, 24000, 4, 12700.00, '155 mm', 'HE', 'AP', 'HESH', NULL, NULL, 40, 'Vehículos, estructuras', 50, 'Vehículos blindados, fortificaciones'),
(8, 'Granadas', 'Arma de apoyo', '40 mm', 10, 150, NULL, 0.22, '40 mm', 'HE', 'Humo', NULL, NULL, NULL, 6, 'Infantería', 10, 'Personal'),
(9, 'Minas Antitanque', 'Mina', 'N/A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Vehículos blindados', 5, 'Vehículos blindados'),
(10, 'Minas Antipersonales', 'Mina', 'N/A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Infantería', 5, 'Personal'),
(11, 'Palmaria', 'Artillería Autopropulsada', '155 mm', 18000, 24000, 4, 46000.00, '155 mm', 'HE', 'AP', 'HESH', NULL, NULL, 40, 'Vehículos, estructuras', 50, 'Vehículos blindados, fortificaciones'),
(12, 'FAP', 'Fusil Ametrallador', '7.62 mm', 800, 1000, 750, 5.20, '7.62 mm', 'Común', 'Trazante', 'Perforante', NULL, 30, 8, 'Infantería, vehículos ligeros', NULL, 'Personal, vehículos ligeros'),
(13, 'MAG', 'Ametralladora de Propósito General', '7.62 mm', 1200, 1800, 950, 11.80, '7.62 mm', 'Común', 'Trazante', 'Perforante', NULL, 100, 5, 'Infantería, vehículos ligeros', NULL, 'Personal, vehículos ligeros'),
(14, 'MG74', 'Ametralladora de Propósito General', '7.62 mm', 1200, 1800, 950, 11.60, '7.62 mm', 'Común', 'Trazante', 'Perforante', NULL, 100, 5, 'Infantería, vehículos ligeros', NULL, 'Personal, vehículos ligeros'),
(15, 'Browning HP', 'Pistola', '9 mm', 50, 100, NULL, 0.90, '9 mm', 'Común', NULL, NULL, NULL, 13, 3, 'Infantería', NULL, 'Personal'),
(16, 'MARA', 'Lanzacohetes', '88.9 mm', 300, 500, NULL, 7.30, '88.9 mm', 'HEAT', NULL, NULL, NULL, 1, 3, 'Vehículos blindados ligeros', 5, 'Vehículos blindados ligeros'),
(17, 'TOW', 'Misil Antitanque', '152 mm', 3000, 3750, NULL, 18.90, '152 mm', 'HEAT', NULL, NULL, NULL, 1, 5, 'Tanques, vehículos blindados', 2, 'Vehículos blindados pesados'),
(18, 'Cañón CITER', 'Artillería', '155 mm', 18000, 24000, 4, 12700.00, '155 mm', 'HE', 'AP', 'HESH', NULL, NULL, 40, 'Vehículos, estructuras', 50, 'Vehículos blindados, fortificaciones'),
(19, 'CP-30', 'Lanzador Múltiple', '127 mm', 28000, 30000, 30, 25000.00, '127 mm', 'HE', NULL, NULL, NULL, NULL, 30, 'Vehículos, estructuras', 100, 'Vehículos, fortificaciones, personal'),
(20, 'Ametralladora 12,7', 'Ametralladora Pesada', '12.7 mm', 1800, 6800, 600, 38.10, '12.7 mm', 'API', 'Trazante', 'Incendiaria', NULL, 100, 5, 'Vehículos ligeros, fortificaciones', NULL, 'Vehículos ligeros, fortificaciones, personal'),
(21, 'TAM2C', 'Tanque', '120 mm', 3000, 4000, 8, 32000.00, '120 mm', 'APFSDS', 'HEAT', 'HE', NULL, NULL, 40, 'Tanques, vehículos blindados', 30, 'Vehículos blindados pesados, fortificaciones');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `armamento_municion`
--

CREATE TABLE `armamento_municion` (
  `id` int(11) NOT NULL,
  `armamento_id` int(11) DEFAULT NULL,
  `tipo_municion` varchar(50) DEFAULT NULL,
  `cantidad` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `game_data`
--

CREATE TABLE `game_data` (
  `id` int(11) NOT NULL,
  `data` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `invitaciones_partida`
--

CREATE TABLE `invitaciones_partida` (
  `id` int(11) NOT NULL,
  `invitador_id` int(11) DEFAULT NULL,
  `invitado_id` int(11) DEFAULT NULL,
  `partida_id` int(11) DEFAULT NULL,
  `estado` enum('pendiente','aceptada','rechazada') DEFAULT 'pendiente',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `marcadores_jugadores`
--

CREATE TABLE `marcadores_jugadores` (
  `id` int(11) NOT NULL,
  `jugador_id` varchar(50) DEFAULT NULL,
  `partida_codigo` varchar(6) DEFAULT NULL,
  `lat` decimal(10,8) DEFAULT NULL,
  `lng` decimal(11,8) DEFAULT NULL,
  `tipo` varchar(50) DEFAULT 'unidad',
  `equipo` varchar(20) DEFAULT NULL,
  `estado` varchar(20) DEFAULT 'activo',
  `simbolo` varchar(50) DEFAULT 'infanteria',
  `magnitud` varchar(50) DEFAULT NULL,
  `designacion` varchar(10) DEFAULT NULL,
  `dependencia` varchar(10) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mensajes_chat`
--

CREATE TABLE `mensajes_chat` (
  `id` int(11) NOT NULL,
  `emisor_id` int(11) DEFAULT NULL,
  `receptor_id` int(11) DEFAULT NULL,
  `partida_id` int(11) DEFAULT NULL,
  `mensaje` text DEFAULT NULL,
  `fecha_envio` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `mensajes_chat`
--

INSERT INTO `mensajes_chat` (`id`, `emisor_id`, `receptor_id`, `partida_id`, `mensaje`, `fecha_envio`) VALUES
(1, NULL, NULL, NULL, 'hola', '2024-10-06 16:22:53'),
(2, NULL, NULL, NULL, 'todo bien??', '2024-10-06 16:25:53'),
(3, NULL, NULL, NULL, 'HOLA', '2024-10-06 17:56:47'),
(4, NULL, NULL, NULL, 'ALGUIEN AQUI?', '2024-10-06 17:56:56'),
(5, NULL, NULL, NULL, '.,,.,', '2024-10-06 18:02:15'),
(6, NULL, NULL, NULL, 'hola', '2024-10-06 19:46:15'),
(7, 2, NULL, NULL, 'hola', '2024-10-06 20:05:51'),
(8, 4, NULL, NULL, 'Hola qué tal', '2024-10-06 20:06:13'),
(9, 2, NULL, NULL, ',..', '2024-10-06 20:06:25'),
(10, 1, NULL, NULL, 'hola??', '2024-10-06 20:10:10'),
(11, 2, NULL, NULL, 'Alguien?', '2024-10-06 20:10:19'),
(12, 2, NULL, NULL, 'Hola', '2024-10-06 20:34:18'),
(13, 2, NULL, NULL, 'hola', '2024-10-06 20:34:30'),
(14, 1, NULL, NULL, 'Hola', '2024-10-06 20:35:03'),
(15, 2, NULL, NULL, 'alguien????', '2024-10-06 20:35:19');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `municiones`
--

CREATE TABLE `municiones` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL,
  `caliber` varchar(50) DEFAULT NULL,
  `damage_against` varchar(255) DEFAULT NULL,
  `effect_radius` int(11) DEFAULT NULL,
  `max_range` int(11) DEFAULT NULL,
  `effective_range` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `partidas`
--

CREATE TABLE `partidas` (
  `id` int(11) NOT NULL,
  `codigo` varchar(10) DEFAULT NULL,
  `configuracion` text DEFAULT NULL,
  `estado` enum('esperando','en_curso','finalizada') DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `jugadores_actuales` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `partidas`
--

INSERT INTO `partidas` (`id`, `codigo`, `configuracion`, `estado`, `fecha_creacion`, `jugadores_actuales`) VALUES
(180, '7D16PK', '{\"nombrePartida\": \"party\", \"duracionPartida\": \"12\", \"duracionTurno\": \"1\", \"objetivoPartida\": \"poco\", \"modo\": \"lan\", \"creadorId\": \"2\"}', 'en_curso', '2025-02-04 12:09:19', 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles_combate`
--

CREATE TABLE `roles_combate` (
  `id` int(11) NOT NULL,
  `role_name` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `roles_combate`
--

INSERT INTO `roles_combate` (`id`, `role_name`, `description`) VALUES
(1, 'Tirador FAL', 'Soldado equipado con fusil FAL'),
(2, 'Tirador MAG', 'Soldado equipado con ametralladora MAG'),
(3, 'Tirador MG', 'Soldado equipado con ametralladora MG'),
(4, 'Tirador FAP', 'Soldado equipado con fusil ametrallador FAP'),
(5, 'Tirador ATAN', 'Soldado equipado con arma antitanque'),
(6, 'Granadero', 'Soldado especializado en el uso de granadas o lanzagranadas'),
(7, 'Jefe de Equipo', 'Jefe de un equipo de infantería'),
(8, 'Jefe de Grupo', 'Jefe de un grupo de infantería'),
(9, 'Jefe de Sección', 'Jefe de una sección de infantería'),
(10, 'Jefe de Compañía', 'Jefe de una compañía de infantería'),
(11, 'Observador Adelantado', 'Soldado especializado en dirigir fuego de artillería o morteros'),
(12, 'Tirador 12.7', 'Opera la ametralladora 12.7 en vehículos de infantería mecanizada'),
(13, 'Jefe de Mortero', 'Jefe de mortero'),
(14, 'Jefe Reemplazante de Mortero', 'Asiste y puede reemplazar al jefe de mortero'),
(15, 'Preparador de Mortero', 'Prepara la munición para el mortero'),
(16, 'Abastecedor de Mortero', 'Suministra las municiones para el mortero'),
(17, 'Cargador de Mortero', 'Carga la munición en el mortero'),
(18, 'Apuntador de Mortero', 'Ajusta la puntería del mortero'),
(19, 'Jefe de CDT', 'Conduce el Centro de Dirección de Tiro'),
(20, 'Operador de Plancheta', 'Maneja la plancheta para cálculos de tiro'),
(21, 'Operador de Goniómetro', 'Opera el goniómetro para mediciones angulares y puntería indirecta'),
(22, 'Conductor de Tanque', 'Maneja el tanque'),
(23, 'Apuntador de Tanque', 'Maneja el sistema de puntería del tanque'),
(24, 'Cargador de Tanque', 'Asiste en la carga del cañón del tanque'),
(25, 'Jefe de Tanque', 'Comanda el tanque'),
(26, 'Jefe de Sección de Tanques', 'Lidera una sección de tanques'),
(27, 'Jefe de Escuadrón de Tanques', 'Lidera un Escuadrón de tanques'),
(28, 'Jefe de Pieza de Artillería', 'Lidera el equipo de una pieza de artillería'),
(29, 'Apuntador de Artillería', 'Maneja el sistema de puntería de la artillería'),
(30, 'Cargador de Artillería', 'Carga la munición en la pieza de artillería'),
(31, 'Sirviente de Pieza', 'Colabora en la posición del cañón y realiza trabajos de mira'),
(32, 'Jefe de CDT Artillería', 'Lidera el Centro de Dirección de Tiro de artillería'),
(33, 'Jefe de CDF', 'Lidera el Centro de Dirección de Fuegos'),
(34, 'Abastecedor de Artillería', 'Suministra municiones para la artillería'),
(35, 'Preparador de Artillería', 'Prepara las municiones para la artillería'),
(36, 'Ingeniero de Combate', 'Especialista en demoliciones y fortificaciones'),
(37, 'Operador de Puentes', 'Especialista en la construcción de puentes militares'),
(38, 'Desactivador de Explosivos', 'Especialista en desactivar artefactos explosivos'),
(39, 'Operador de Radio', 'Maneja los equipos de comunicación'),
(40, 'Especialista en Guerra Electrónica', 'Maneja equipos de interferencia y contramedidas electrónicas'),
(41, 'Tirador Comunicante', 'Lleva FAL, realiza tendidos eléctricos, antenas de circunstancia y opera radios'),
(42, 'Explorador', 'Soldado especializado en misiones de reconocimiento'),
(43, 'Explorador FAL', 'Explorador equipado con fusil FAL'),
(44, 'Explorador FAP', 'Explorador equipado con fusil ametrallador FAP'),
(45, 'Explorador MAG', 'Explorador equipado con ametralladora MAG'),
(46, 'Tirador Especial', 'Tirador de precisión para largas distancias'),
(47, 'Observador', 'Asiste al tirador especial en la detección de objetivos'),
(48, 'Conductor de Vehículo Logístico', 'Opera vehículos de transporte y abastecimiento'),
(49, 'Especialista en Abastecimiento', 'Gestiona los suministros y la logística'),
(50, 'Mecánico de Vehículos', 'Mantiene y repara vehículos militares'),
(51, 'Armero', 'Mantiene y repara armamento'),
(52, 'Abastecedor Logístico', 'Asiste en el abastecimiento y brinda seguridad a los trenes de combate y campaña'),
(53, 'Auxiliar de Mecánico', 'Asiste a los mecánicos en el mantenimiento y reparación'),
(54, 'Cocinero', 'Prepara las comidas para las tropas'),
(55, 'Talabartero', 'Repara y mantiene equipos de cuero y lona'),
(56, 'Sastre', 'Repara y mantiene uniformes y otros textiles'),
(57, 'Médico de Combate', 'Proporciona atención médica en el campo de batalla'),
(58, 'Enfermero de Combate', 'Asiste al médico y proporciona primeros auxilios'),
(59, 'Conductor de Ambulancia', 'Opera vehículos de evacuación médica'),
(60, 'Camillero', 'Auxilia al enfermero y transporta heridos');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `unidades`
--

CREATE TABLE `unidades` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `tipo` varchar(50) DEFAULT NULL COMMENT 'magnitud: equipo, seccion, etc',
  `especialidad` varchar(50) DEFAULT NULL COMMENT 'tipo: infanteria, caballeria, etc',
  `subtipo` varchar(50) DEFAULT NULL COMMENT 'modificador SIDC'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `unidades`
--

INSERT INTO `unidades` (`id`, `nombre`, `tipo`, `especialidad`, `subtipo`) VALUES
(1, 'Equipo de Tiradores', 'Equipo', 'Infantería', 'Tiradores'),
(2, 'Grupo de Tiradores', 'Grupo', 'Infantería', 'Tiradores'),
(3, 'Grupo de Apoyo', 'Grupo', 'Infantería', 'Apoyo'),
(4, 'Sección de Tiradores', 'Sección', 'Infantería', 'Tiradores'),
(5, 'Puesto Comando', 'Grupo', 'Infantería', 'Comando'),
(6, 'Tren de Subunidad', 'Grupo', 'Infantería', 'Logística'),
(7, 'Compañía de Infantería', 'Subunidad', 'Infantería', NULL),
(8, 'Regimiento de Infantería', 'Unidad', 'Infantería', NULL),
(17, 'Puesto Comando de Subunidad', 'Grupo', 'Infantería', 'Comando'),
(20, 'Puesto Comando de Unidad', 'Grupo', 'Infantería', 'Comando'),
(21, 'Sección Morteros', 'Sección', 'Infantería', 'Apoyo'),
(22, 'Tren de Combate', 'Grupo', 'Infantería', 'Logística'),
(23, 'Tren de Campaña', 'Grupo', 'Infantería', 'Logística'),
(24, 'Subunidad de Servicios', 'Subunidad', 'Infantería', 'Servicios'),
(28, 'Pelotón Comando', 'Grupo', 'Caballería Blindada', 'Comando'),
(29, 'Tren de Escuadrón', 'Grupo', 'Caballería Blindada', 'Logística'),
(31, 'Escuadrón Servicios', 'Subunidad', 'Caballería Blindada', 'Servicios'),
(32, 'Sección Exploración', 'Sección', 'Caballería Blindada', 'Exploración'),
(33, 'Sección Morteros Pesados', 'Sección', 'Caballería Blindada', 'Apoyo'),
(34, 'Puesto Comando de Regimiento', 'Grupo', 'Caballería Blindada', 'Comando'),
(35, 'Tren de Combate de Regimiento', 'Grupo', 'Caballería Blindada', 'Logística'),
(36, 'Tren de Campaña de Regimiento', 'Grupo', 'Caballería Blindada', 'Logística'),
(38, 'Equipo de Exploración', 'Equipo', 'Caballería de Exploración', 'Exploración'),
(39, 'Grupo de Exploración', 'Grupo', 'Caballería de Exploración', 'Exploración'),
(40, 'Sección de Exploración', 'Sección', 'Caballería de Exploración', 'Exploración'),
(41, 'Escuadrón de Exploración', 'Subunidad', 'Caballería de Exploración', NULL),
(42, 'Regimiento de Caballería de Exploración', 'Unidad', 'Caballería de Exploración', NULL),
(43, 'Puesto Comando de Exploración', 'Grupo', 'Caballería de Exploración', 'Comando'),
(44, 'Tren de Escuadrón de Exploración', 'Grupo', 'Caballería de Exploración', 'Logística'),
(45, 'Pieza de Artillería', 'Grupo', 'Artillería', 'Pieza'),
(46, 'Sección de Tiro', 'Sección', 'Artillería', 'Tiro'),
(47, 'Batería de Tiro', 'Subunidad', 'Artillería', 'Tiro'),
(48, 'Grupo de Artillería', 'Unidad', 'Artillería', NULL),
(49, 'Centro de Dirección de Tiro', 'Grupo', 'Artillería', 'Comando'),
(50, 'Centro de Dirección de Fuego', 'Grupo', 'Artillería', 'Comando'),
(51, 'Sección Adquisición de Blancos', 'Sección', 'Artillería', 'Reconocimiento'),
(52, 'Tren de Batería', 'Grupo', 'Artillería', 'Logística'),
(53, 'Tren de Grupo', 'Grupo', 'Artillería', 'Logística'),
(54, 'Equipo de Ingenieros', 'Equipo', 'Ingenieros', NULL),
(55, 'Sección de Ingenieros', 'Sección', 'Ingenieros', NULL),
(56, 'Compañía de Ingenieros', 'Subunidad', 'Ingenieros', NULL),
(57, 'Batallón de Ingenieros', 'Unidad', 'Ingenieros', NULL),
(58, 'Equipo de Comunicaciones', 'Equipo', 'Comunicaciones', NULL),
(59, 'Sección de Comunicaciones', 'Sección', 'Comunicaciones', NULL),
(60, 'Compañía de Comunicaciones', 'Subunidad', 'Comunicaciones', NULL),
(61, 'Batallón de Comunicaciones', 'Unidad', 'Comunicaciones', NULL),
(62, 'Pieza Mortero 120', 'Grupo', 'Caballería Blindada', 'Apoyo de Fuego'),
(63, 'Pieza Mortero 81', 'Grupo', 'Infantería', 'Apoyo de Fuego'),
(65, 'Sección de Servicio de Piezas', 'Sección', 'Artillería', 'Logística'),
(81, 'Grupo Tanque (TAM)', 'Grupo', 'Caballería Blindada', 'Tanque'),
(82, 'Sección de Tanques (TAM)', 'Sección', 'Caballería Blindada', 'Tanques'),
(83, 'Escuadrón de Tanques (TAM)', 'Subunidad', 'Caballería Blindada', NULL),
(84, 'Regimiento de Caballería Blindada (TAM)', 'Unidad', 'Caballería Blindada', NULL),
(85, 'Grupo Tanque (SK)', 'Grupo', 'Caballería Blindada', 'Tanque'),
(86, 'Sección de Tanques (SK)', 'Sección', 'Caballería Blindada', 'Tanques'),
(87, 'Escuadrón de Tanques (SK)', 'Subunidad', 'Caballería Blindada', NULL),
(88, 'Regimiento de Caballería Blindada (SK)', 'Unidad', 'Caballería Blindada', NULL),
(89, 'Grupo Tanque (TAM2C)', 'Grupo', 'Caballería Blindada', 'Tanque'),
(90, 'Sección de Tanques (TAM2C)', 'Sección', 'Caballería Blindada', 'Tanques'),
(91, 'Escuadrón de Tanques (TAM2C)', 'Subunidad', 'Caballería Blindada', NULL),
(92, 'Regimiento de Caballería Blindada (TAM2C)', 'Unidad', 'Caballería Blindada', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `unidades_armamento`
--

CREATE TABLE `unidades_armamento` (
  `id` int(11) NOT NULL,
  `unidad_id` int(11) DEFAULT NULL,
  `armamento_id` int(11) DEFAULT NULL,
  `cantidad` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `unidades_roles`
--

CREATE TABLE `unidades_roles` (
  `unidad_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `cantidad` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `unidades_roles`
--

INSERT INTO `unidades_roles` (`unidad_id`, `role_id`, `cantidad`) VALUES
(49, 1, 2),
(49, 19, 1),
(49, 20, 1),
(49, 21, 1),
(62, 13, 1),
(62, 14, 1),
(62, 15, 2),
(62, 16, 2),
(62, 17, 1),
(62, 18, 1),
(63, 13, 1),
(63, 14, 1),
(63, 15, 2),
(63, 16, 2),
(63, 17, 1),
(63, 18, 1),
(81, 22, 1),
(81, 23, 1),
(81, 24, 1),
(81, 25, 1),
(85, 22, 1),
(85, 23, 1),
(85, 25, 1),
(89, 22, 1),
(89, 23, 1),
(89, 24, 1),
(89, 25, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `unidades_vehiculos`
--

CREATE TABLE `unidades_vehiculos` (
  `id` int(11) NOT NULL,
  `unidad_id` int(11) DEFAULT NULL,
  `vehiculo_id` int(11) DEFAULT NULL,
  `cantidad` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `unidad` varchar(255) DEFAULT NULL,
  `is_online` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `username`, `password`, `email`, `unidad`, `is_online`) VALUES
(1, 'EHR051', '$2b$12$mnTSDZ7zVyDbwxIuXilb8uSMeUQd9IPbOHsmjw6SEvBGzFtkkToMi', 'exekielrua@gmail.com', 'Tan11', 0),
(2, 'Javo', '$2b$12$fN5KCuzfDM3Ci26Tw0dvwO4AmqtgCw2rL/V2XP0ozTwU4AygBgIGu', 'elJavo@milei.com', 'Tan11', 0),
(3, 'enano', '$2b$12$ixqZ5.HQeTEFlgdj9EDE/OF299eSstQ.FpbZnswyai84huNf35VKi', 'exekielhrua@gmail.com', 'gcd', 0),
(4, 'User3', '$2b$12$/To18jXwv6i8o0KdwGlw5.nvoRcjjjDBQfS67q6./GDcoCed6HZ2e', 'el3@si.com', 'Ninguna', 0),
(6, 'username1', 'hashed_password', 'user1@example.com', 'unidad1', 1),
(7, 'marin', '$2b$12$0IbzPHciXzRTFk11eLMDzOwIZLHw28ObSUzhmmSoJ0QsO1EdvHDgO', 'marin@gmail.com', '1234', 0),
(8, 'Andpereyra', '$2b$12$umggNVXgHn8qTgCOC4eAFuhxNwESw4JMh2ikFt7ZToTBzH8iNpFy6', 'pereyraandres476@gmail.com', 'RC Tan 11', 0),
(9, 'Mateo', '$2b$12$zroZFaYBdGyhXSgvw5dgPuRyjfWzGDOQ74DZE3ZeQsvFMkqnV2sci', 'bourlotmateo58@gmail.com', 'RC Tan 11', 0),
(10, 'Quantin', '$2b$12$x3ybBMu5z4O.n21sm09zAOHktxWZGghc57lHd4S3k0mP5sQmhXRmS', 'qunti@gmail.com', 'Tan11', 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios_partida`
--

CREATE TABLE `usuarios_partida` (
  `id` int(11) NOT NULL,
  `partida_id` int(11) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `equipo` varchar(20) DEFAULT NULL,
  `listo` tinyint(1) DEFAULT 0,
  `esCreador` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `usuarios_partida`
--

INSERT INTO `usuarios_partida` (`id`, `partida_id`, `usuario_id`, `equipo`, `listo`, `esCreador`) VALUES
(122, 89, 2, 'rojo', 1, 1),
(124, 89, 8, 'azul', 1, 0),
(126, 90, 8, 'azul', 1, 0),
(241, 180, 2, 'rojo', 1, 1),
(242, 180, 10, 'azul', 1, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `vehicles`
--

CREATE TABLE `vehicles` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL,
  `capacity_personal` int(11) DEFAULT NULL,
  `cargo_capacity` varchar(50) DEFAULT NULL,
  `fuel_capacity` decimal(5,2) DEFAULT NULL,
  `supplementary_tank` decimal(5,2) DEFAULT NULL,
  `fuel_consumption` decimal(5,3) DEFAULT NULL,
  `autonomy_without_supplement` decimal(6,2) DEFAULT NULL,
  `autonomy_with_supplement` decimal(6,2) DEFAULT NULL,
  `mobility_road` decimal(5,2) DEFAULT NULL,
  `mobility_offroad` decimal(5,2) DEFAULT NULL,
  `mobility_forest` decimal(5,2) DEFAULT NULL,
  `mobility_mountain` decimal(5,2) DEFAULT NULL,
  `mobility_urban` decimal(5,2) DEFAULT NULL,
  `mobility_desert` decimal(5,2) DEFAULT NULL,
  `mobility_snow` decimal(5,2) DEFAULT NULL,
  `mobility_swamp` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `vehicles`
--

INSERT INTO `vehicles` (`id`, `name`, `type`, `capacity_personal`, `cargo_capacity`, `fuel_capacity`, `supplementary_tank`, `fuel_consumption`, `autonomy_without_supplement`, `autonomy_with_supplement`, `mobility_road`, `mobility_offroad`, `mobility_forest`, `mobility_mountain`, `mobility_urban`, `mobility_desert`, `mobility_snow`, `mobility_swamp`) VALUES
(1, 'VC TAM', 'Transporte de Asalto', 4, NULL, 650.00, NULL, 0.450, 500.00, NULL, 1.00, 0.80, 0.40, 0.50, 0.70, 0.90, 0.60, 0.20),
(2, 'VC TAM 2C', 'Transporte de Asalto', 4, NULL, 650.00, NULL, 0.450, 520.00, NULL, 1.00, 0.80, 0.40, 0.50, 0.70, 0.90, 0.60, 0.20),
(3, 'VC SK 105', 'Transporte de Asalto', 3, NULL, 420.00, NULL, 0.300, 550.00, NULL, 1.00, 0.90, 0.50, 0.60, 0.80, 0.90, 0.70, 0.30),
(4, 'M113', 'Transporte de personal', 11, '2 toneladas', 360.00, NULL, 0.100, 480.00, NULL, 1.00, 0.90, 0.60, 0.70, 0.80, 0.90, 0.80, 0.40),
(5, 'VCTP', 'Transporte de Personal', 12, '1 tonelada', 650.00, NULL, 0.250, 550.00, NULL, 1.00, 0.80, 0.50, 0.60, 0.70, 0.90, 0.70, 0.30),
(6, 'VCTM', 'Transporte de Morteros', 7, NULL, 650.00, NULL, 0.250, 550.00, NULL, 1.00, 0.80, 0.50, 0.60, 0.70, 0.90, 0.70, 0.30),
(7, 'Agrale Marruá', 'Utilitario', 4, '750 kg', 80.00, 12.00, 0.012, 600.00, NULL, 1.00, 0.90, 0.70, 0.80, 0.90, 0.90, 0.80, 0.50),
(8, 'Mercedes-Benz 1114', 'Camión', 3, '7 toneladas', 200.00, 25.00, 0.025, 800.00, NULL, 1.00, 0.70, 0.30, 0.40, 0.60, 0.80, 0.50, 0.10),
(9, 'Mercedes-Benz 1518', 'Camión', 3, '10 toneladas', 250.00, 30.00, 0.030, 800.00, NULL, 1.00, 0.70, 0.30, 0.40, 0.60, 0.80, 0.50, 0.10),
(10, 'Mercedes-Benz 1720', 'Camión', 3, '12 toneladas', 300.00, 35.00, 0.035, 850.00, NULL, 1.00, 0.60, 0.20, 0.30, 0.50, 0.70, 0.40, 0.10),
(11, 'Mercedes-Benz 1113', 'Camión', 3, '6 toneladas', 180.00, 22.00, 0.022, 800.00, NULL, 1.00, 0.70, 0.30, 0.40, 0.60, 0.80, 0.50, 0.10),
(12, 'Unimog U416', 'Camión todoterreno', 3, '2 toneladas', 160.00, 20.00, 0.020, 800.00, NULL, 1.00, 0.90, 0.70, 0.80, 0.80, 0.90, 0.80, 0.60),
(13, 'Camión con carretón', 'Transporte de tanques', 2, '1 tanque', 400.00, 50.00, 0.050, 600.00, NULL, 0.80, 0.40, 0.10, 0.20, 0.30, 0.50, 0.30, 0.10),
(14, 'Bell UH-1H \"Huey\"', 'Helicóptero', 13, '1.3 toneladas', 820.00, NULL, 0.270, 3.00, NULL, 1.00, 1.00, NULL, NULL, NULL, NULL, NULL, NULL),
(15, 'H145M', 'Helicóptero', 10, '1 tonelada', 850.00, NULL, 0.250, 5.00, NULL, 1.00, 1.00, NULL, NULL, NULL, NULL, NULL, NULL),
(16, 'Mi-171', 'Helicóptero', 15, '4 toneladas', 900.00, NULL, 0.300, 6.00, NULL, 1.00, 1.00, NULL, NULL, NULL, NULL, NULL, NULL),
(17, 'Yamaha XT 350', 'Motocicleta', 2, '0.2 toneladas', 14.00, NULL, 0.005, 300.00, NULL, 1.00, 0.90, 0.80, 0.70, 0.60, 0.50, 0.50, 0.50),
(18, 'Honda Tornado 250', 'Motocicleta', 2, '0.2 toneladas', 12.00, NULL, 0.004, 250.00, NULL, 1.00, 0.90, 0.80, 0.70, 0.60, 0.50, 0.50, 0.50),
(19, 'Himalayan 450', 'Motocicleta', 2, '0.3 toneladas', 15.00, NULL, 0.006, 350.00, NULL, 1.00, 0.90, 0.80, 0.70, 0.60, 0.50, 0.50, 0.50);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `vehiculos_municion`
--

CREATE TABLE `vehiculos_municion` (
  `id` int(11) NOT NULL,
  `vehiculo_id` int(11) DEFAULT NULL,
  `tipo_municion` varchar(50) DEFAULT NULL,
  `cantidad` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `amigos`
--
ALTER TABLE `amigos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `amigo_id` (`amigo_id`);

--
-- Indices de la tabla `animals`
--
ALTER TABLE `animals`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `armamento`
--
ALTER TABLE `armamento`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `armamento_municion`
--
ALTER TABLE `armamento_municion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `armamento_id` (`armamento_id`);

--
-- Indices de la tabla `game_data`
--
ALTER TABLE `game_data`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `invitaciones_partida`
--
ALTER TABLE `invitaciones_partida`
  ADD PRIMARY KEY (`id`),
  ADD KEY `invitador_id` (`invitador_id`),
  ADD KEY `invitado_id` (`invitado_id`),
  ADD KEY `partida_id` (`partida_id`);

--
-- Indices de la tabla `marcadores_jugadores`
--
ALTER TABLE `marcadores_jugadores`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jugador_id` (`jugador_id`,`partida_codigo`);

--
-- Indices de la tabla `mensajes_chat`
--
ALTER TABLE `mensajes_chat`
  ADD PRIMARY KEY (`id`),
  ADD KEY `emisor_id` (`emisor_id`),
  ADD KEY `receptor_id` (`receptor_id`),
  ADD KEY `partida_id` (`partida_id`);

--
-- Indices de la tabla `municiones`
--
ALTER TABLE `municiones`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `partidas`
--
ALTER TABLE `partidas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`);

--
-- Indices de la tabla `roles_combate`
--
ALTER TABLE `roles_combate`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `unidades`
--
ALTER TABLE `unidades`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `unidades_armamento`
--
ALTER TABLE `unidades_armamento`
  ADD PRIMARY KEY (`id`),
  ADD KEY `unidad_id` (`unidad_id`),
  ADD KEY `armamento_id` (`armamento_id`);

--
-- Indices de la tabla `unidades_roles`
--
ALTER TABLE `unidades_roles`
  ADD PRIMARY KEY (`unidad_id`,`role_id`),
  ADD KEY `role_id` (`role_id`);

--
-- Indices de la tabla `unidades_vehiculos`
--
ALTER TABLE `unidades_vehiculos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `unidad_id` (`unidad_id`),
  ADD KEY `vehiculo_id` (`vehiculo_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indices de la tabla `usuarios_partida`
--
ALTER TABLE `usuarios_partida`
  ADD PRIMARY KEY (`id`),
  ADD KEY `partida_id` (`partida_id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `vehiculos_municion`
--
ALTER TABLE `vehiculos_municion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vehiculo_id` (`vehiculo_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `amigos`
--
ALTER TABLE `amigos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT de la tabla `animals`
--
ALTER TABLE `animals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `armamento`
--
ALTER TABLE `armamento`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT de la tabla `armamento_municion`
--
ALTER TABLE `armamento_municion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `game_data`
--
ALTER TABLE `game_data`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `invitaciones_partida`
--
ALTER TABLE `invitaciones_partida`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `marcadores_jugadores`
--
ALTER TABLE `marcadores_jugadores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `mensajes_chat`
--
ALTER TABLE `mensajes_chat`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `municiones`
--
ALTER TABLE `municiones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `partidas`
--
ALTER TABLE `partidas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=181;

--
-- AUTO_INCREMENT de la tabla `roles_combate`
--
ALTER TABLE `roles_combate`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT de la tabla `unidades`
--
ALTER TABLE `unidades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=93;

--
-- AUTO_INCREMENT de la tabla `unidades_armamento`
--
ALTER TABLE `unidades_armamento`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `unidades_vehiculos`
--
ALTER TABLE `unidades_vehiculos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `usuarios_partida`
--
ALTER TABLE `usuarios_partida`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=243;

--
-- AUTO_INCREMENT de la tabla `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de la tabla `vehiculos_municion`
--
ALTER TABLE `vehiculos_municion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `amigos`
--
ALTER TABLE `amigos`
  ADD CONSTRAINT `amigos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `amigos_ibfk_2` FOREIGN KEY (`amigo_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `armamento_municion`
--
ALTER TABLE `armamento_municion`
  ADD CONSTRAINT `armamento_municion_ibfk_1` FOREIGN KEY (`armamento_id`) REFERENCES `armamento` (`id`);

--
-- Filtros para la tabla `invitaciones_partida`
--
ALTER TABLE `invitaciones_partida`
  ADD CONSTRAINT `invitaciones_partida_ibfk_1` FOREIGN KEY (`invitador_id`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `invitaciones_partida_ibfk_2` FOREIGN KEY (`invitado_id`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `invitaciones_partida_ibfk_3` FOREIGN KEY (`partida_id`) REFERENCES `partidas` (`id`);

--
-- Filtros para la tabla `marcadores_jugadores`
--
ALTER TABLE `marcadores_jugadores`
  ADD CONSTRAINT `marcadores_jugadores_ibfk_1` FOREIGN KEY (`jugador_id`,`partida_codigo`) REFERENCES `jugadores` (`id`, `partida_codigo`);

--
-- Filtros para la tabla `mensajes_chat`
--
ALTER TABLE `mensajes_chat`
  ADD CONSTRAINT `mensajes_chat_ibfk_1` FOREIGN KEY (`emisor_id`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `mensajes_chat_ibfk_2` FOREIGN KEY (`receptor_id`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `mensajes_chat_ibfk_3` FOREIGN KEY (`partida_id`) REFERENCES `partidas` (`id`);

--
-- Filtros para la tabla `unidades_armamento`
--
ALTER TABLE `unidades_armamento`
  ADD CONSTRAINT `unidades_armamento_ibfk_1` FOREIGN KEY (`unidad_id`) REFERENCES `unidades` (`id`),
  ADD CONSTRAINT `unidades_armamento_ibfk_2` FOREIGN KEY (`armamento_id`) REFERENCES `armamento` (`id`);

--
-- Filtros para la tabla `unidades_roles`
--
ALTER TABLE `unidades_roles`
  ADD CONSTRAINT `unidades_roles_ibfk_1` FOREIGN KEY (`unidad_id`) REFERENCES `unidades` (`id`),
  ADD CONSTRAINT `unidades_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles_combate` (`id`);

--
-- Filtros para la tabla `unidades_vehiculos`
--
ALTER TABLE `unidades_vehiculos`
  ADD CONSTRAINT `unidades_vehiculos_ibfk_1` FOREIGN KEY (`unidad_id`) REFERENCES `unidades` (`id`),
  ADD CONSTRAINT `unidades_vehiculos_ibfk_2` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehicles` (`id`);

--
-- Filtros para la tabla `usuarios_partida`
--
ALTER TABLE `usuarios_partida`
  ADD CONSTRAINT `usuarios_partida_ibfk_1` FOREIGN KEY (`partida_id`) REFERENCES `partidas` (`id`),
  ADD CONSTRAINT `usuarios_partida_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `vehiculos_municion`
--
ALTER TABLE `vehiculos_municion`
  ADD CONSTRAINT `vehiculos_municion_ibfk_1` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehicles` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
