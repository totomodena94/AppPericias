// ============================================
// DATOS ESTÁTICOS
// Vendedores agrupados por sede/división.
// ============================================
const vendedoresPorSede = {
  "salaria-nuovo": ["Barcilli", "Terzuoli", "Rossi", "Rossi Sciarra", "Montecchi", "Panetta", "Scrima", "Pileggi", "Gutu", "Felli", "Geamana", "Antinucci", "Fratesi", "Miele", "Mari", "Litta"],
  "salaria-usato": ["Grasso", "Corradini", "D'Angelo", "Pelini", "Serafini", "Gastaldello", "Risita", "Silvestri"],
  "appia-nuovo": ["Brutti", "Buttarelli", "Cesarini", "Chiarelli", "Alessandroni", "De Angelis", "Fresia", "Corirossi", "Perra", "Zevini", "Sacchi", "Scrocca", "Calderino", "Venditti"],
  "appia-usato": ["Amaricci", "Miscioscia", "Nobili"],
  "barberini": ["Limardi", "Macrí", "Nardulli", "Sbizzera", "Borgia"],
};


// ============================================
// FUNCIONES DE CÁLCULO (analítica)
// Reciben un array de pericias y devuelven un
// resultado calculado. No tocan el DOM.
// ============================================

// Devuelve solo las pericias de los últimos N meses (por defecto, para
// no mostrar los 3 años de historial completo apenas se abre la app).
const filtrarUltimosMeses = function (pericias, cantidadMeses) {
  const hoy = new Date();
  hoy.setMonth(hoy.getMonth() - cantidadMeses);

  const año = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  const fechaLimite = `${año}-${mes}-${dia}`;

  return pericias.filter(function (pericia) {
    return pericia.fecha && pericia.fecha >= fechaLimite;
  });
};

// Cuenta cuántas pericias hay en total.
const calcularTotalMes = function (pericias) {
  return pericias.length;
};

// Agrupa las pericias por vendedor y cuenta cuántas
// tiene cada uno. Devuelve un array de pares
// [nombre, cantidad], ordenado de mayor a menor.
const calcularPericiasPorVendedor = function (pericias) {
  const conteo = {};

  for (const pericia of pericias) {
    const nombreVendedor = pericia.vendedor;

    if (conteo[nombreVendedor] === undefined) {
      conteo[nombreVendedor] = 1; // primera vez que aparece este vendedor
    } else {
      conteo[nombreVendedor] += 1; // ya existía, se suma 1
    }
  }

  // Object.entries convierte { Rossi: 3, Grasso: 1 } en [["Rossi", 3], ["Grasso", 1]]
  const conteoComoArray = Object.entries(conteo);

  // ordena de mayor a menor cantidad (b[1] - a[1])
  const conteoComoArrayOrdenado = conteoComoArray.sort(function (a, b) {
    return b[1] - a[1];
  });

  return conteoComoArrayOrdenado;
};

// Calcula qué porcentaje de patentes distintas aparece
// más de una vez (o sea, se transformaron en una segunda pericia).
const calcularPorcentajeConversionPericias = function (pericias) {
  const conteo = {};

  for (const pericia of pericias) {
    const targaPericia = pericia.targa;

    if (conteo[targaPericia] === undefined) {
      conteo[targaPericia] = 1;
    } else {
      conteo[targaPericia] += 1;
    }
  }

  const conteoComoArray = Object.entries(conteo);

  // solo las patentes que aparecen más de una vez
  const patentesRepetidas = conteoComoArray.filter(function (entrada) {
    return entrada[1] > 1;
  });

  const porcentajeDeConversion = (patentesRepetidas.length / conteoComoArray.length) * 100;

  return porcentajeDeConversion;
};

// Agrupa TODO el historial por mes ("YYYY-MM") y cuenta cuántas pericias
// hay en cada uno. A diferencia de las demás funciones de esta sección,
// usa el historial completo a propósito (es para el gráfico de tendencia
// mensual, que tiene sentido solo mirando varios años). Devuelve las
// etiquetas ya ordenadas cronológicamente junto con sus conteos.
const agruparPorMes = function (pericias) {
  const conteo = {};

  for (const pericia of pericias) {
    if (!pericia.fecha) continue;
    const mes = pericia.fecha.slice(0, 7); // "YYYY-MM"

    if (conteo[mes] === undefined) {
      conteo[mes] = 1;
    } else {
      conteo[mes] += 1;
    }
  }

  // las claves "YYYY-MM" ordenan alfabéticamente igual que cronológicamente
  const mesesOrdenados = Object.keys(conteo).sort();
  const data = mesesOrdenados.map(function (mes) {
    return conteo[mes];
  });

  return { labels: mesesOrdenados, data: data };
};

// Devuelve solo las pericias del mes calendario en curso (distinto de
// filtrarUltimosMeses, que trae un rango de N meses hacia atrás).
const filtrarMesEnCurso = function (pericias) {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mesFormateado = String(hoy.getMonth() + 1).padStart(2, "0");
  const mesEnCurso = `${año}-${mesFormateado}`;

  return pericias.filter(function (pericia) {
    return pericia.fecha && pericia.fecha.startsWith(mesEnCurso);
  });
};

// Agrupa las pericias del mes en curso por día (1 al último día del mes)
// y, dentro de cada día, por tipo. Pensado para una barra apilada por día,
// con un segmento de color por tipo.
const agruparPorDiaYTipo = function (periciasDelMes) {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = hoy.getMonth(); // 0-11
  // día 0 del mes siguiente = último día de este mes
  const ultimoDia = new Date(año, mes + 1, 0).getDate();

  const porDia = {};
  for (let dia = 1; dia <= ultimoDia; dia++) {
    porDia[dia] = { perizia: 0, controperizia: 0, demo: 0 };
  }

  for (const pericia of periciasDelMes) {
    if (!pericia.fecha) continue;
    const dia = Number(pericia.fecha.slice(8, 10));
    if (!porDia[dia]) continue; // fecha corrupta o fuera de rango: se ignora
    if (porDia[dia][pericia.tipo] === undefined) continue; // tipo desconocido: se ignora
    porDia[dia][pericia.tipo] += 1;
  }

  const labels = [];
  const perizia = [];
  const controperizia = [];
  const demo = [];

  for (let dia = 1; dia <= ultimoDia; dia++) {
    labels.push(String(dia));
    perizia.push(porDia[dia].perizia);
    controperizia.push(porDia[dia].controperizia);
    demo.push(porDia[dia].demo);
  }

  return { labels: labels, perizia: perizia, controperizia: controperizia, demo: demo };
};

// Cuenta cuántas pericias del mes en curso hay de cada tipo.
const contarPorTipo = function (periciasDelMes) {
  const conteo = { perizia: 0, controperizia: 0, demo: 0 };

  for (const pericia of periciasDelMes) {
    if (conteo[pericia.tipo] === undefined) continue; // tipo desconocido: se ignora
    conteo[pericia.tipo] += 1;
  }

  return conteo;
};

// Cuenta, sobre el historial completo, cuántas patentes aparecen una sola
// vez ("únicas") contra cuántas aparecen más de una vez ("convertidas" a
// segunda pericia). Son los conteos crudos que necesita el gráfico 4;
// calcularPorcentajeConversionPericias ya calcula el porcentaje a partir
// de la misma idea, pero para un gráfico de torta se necesitan los conteos.
const contarConversion = function (pericias) {
  const conteo = {};

  for (const pericia of pericias) {
    const targaPericia = pericia.targa;
    if (conteo[targaPericia] === undefined) {
      conteo[targaPericia] = 1;
    } else {
      conteo[targaPericia] += 1;
    }
  }

  let unicas = 0;
  let convertidas = 0;

  for (const cantidad of Object.values(conteo)) {
    if (cantidad > 1) {
      convertidas += 1;
    } else {
      unicas += 1;
    }
  }

  return { unicas: unicas, convertidas: convertidas };
};


// ============================================
// FUNCIONES DE RENDERIZADO
// Leen datos de localStorage (o reciben un array
// ya filtrado) y actualizan el DOM.
// Se declaran ANTES de usarse, porque se llaman
// apenas carga la página.
// ============================================

// Escapa los caracteres especiales de HTML para que un texto
// escrito por el usuario (ej. notas) se muestre tal cual y no
// se interprete como HTML al ir dentro de innerHTML (evita XSS).
// Si el campo no existe (registro viejo importado), devuelve "".
const escaparHTML = function (texto) {
  if (texto === undefined || texto === null) {
    return "";
  }
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

// Pinta la tabla de pericias. Si no le pasan un array,
// lee todo desde localStorage; si le pasan uno
// (por ejemplo, ya filtrado), usa ese en su lugar.
const renderizarTabla = function (periciasARenderizar) {
  const filaTabla = document.querySelector("tbody");
  let pericias;

  if (periciasARenderizar === undefined) {
    const guardado = localStorage.getItem("pericias");
    if (guardado === null) {
      pericias = [];
    } else {
      pericias = JSON.parse(guardado);
    }
  } else {
    pericias = periciasARenderizar;
  }

  // guarda lo que está actualmente visible, para que
  // el botón de exportar CSV sepa qué exportar
  periciasVisibles = pericias;

  let contenidoTabla = "";

  for (const [index, pericia] of pericias.entries()) {
    contenidoTabla += `
      <tr>
        <td>${pericia.targa}</td>
        <td>${pericia.brand}</td>
        <td>${pericia.concesionaria}</td>
        <td>${pericia.vendedor}</td>
        <td>${pericia.fecha}</td>
        <td>${pericia.tipo}</td>
        <td>${escaparHTML(pericia.notas)}</td>
        <td>
          <button class="btn-eliminar" data-index="${index}">Elimina</button>
          <button class="btn-editar" data-index="${index}">Edita</button>
        </td>
      </tr>
      `;
  }

  filaTabla.innerHTML = contenidoTabla;
};

// Pinta el panel de análisis (total, top 3 vendedores,
// % de conversión a segunda pericia). Si no le pasan un
// array, lee todo desde localStorage; si le pasan uno
// (por ejemplo, ya filtrado a los últimos meses), usa ese.
const renderizarAnalisis = function (periciasParaAnalizar) {
  let pericias;

  if (periciasParaAnalizar === undefined) {
    const guardado = localStorage.getItem("pericias");
    if (guardado === null) {
      pericias = [];
    } else {
      pericias = JSON.parse(guardado);
    }
  } else {
    pericias = periciasParaAnalizar;
  }

  const totalPericias = calcularTotalMes(pericias);
  const vendedoresOrdenados = calcularPericiasPorVendedor(pericias);
  const porcentaje = calcularPorcentajeConversionPericias(pericias);

  // slice() copia los primeros 3 elementos sin modificar el array original
  const top3 = vendedoresOrdenados.slice(0, 3);

  let listaVendedores = "";
  for (const entrada of top3) {
    listaVendedores += `<li>${entrada[0]}: ${entrada[1]} pericias</li>`;
  }

  const contenidoAnalisis = document.getElementById("contenido-analisis");

  contenidoAnalisis.innerHTML = `
    <p>Perizie totali: ${totalPericias}</p>
    <p>Top venditori:</p>
    <ul>${listaVendedores}</ul>
    <p>% conversione in seconda perizia: ${porcentaje.toFixed(1)}%</p>
  `;
};

// ============================================
// GRÁFICOS (Chart.js)
// Paleta validada con validate_palette.js (skill de dataviz):
// segura para daltonismo y con contraste chequeado, no elegida a ojo.
// ============================================
const coloresTipo = {
  perizia: "#2a78d6",
  controperizia: "#eb6834",
  demo: "#1baf7a",
};

const coloresConversion = {
  unicas: "#2a78d6",
  convertidas: "#eb6834",
};

// Guarda las instancias de Chart.js ya creadas, indexadas por id de
// canvas. Hace falta para poder destruir la instancia anterior antes de
// crear una nueva: si no, Chart.js las va acumulando en el mismo canvas
// y termina rompiendo el repintado.
const instanciasGraficos = {};

const crearOActualizarGrafico = function (idCanvas, config) {
  if (instanciasGraficos[idCanvas]) {
    instanciasGraficos[idCanvas].destroy();
  }
  const contexto = document.getElementById(idCanvas).getContext("2d");
  instanciasGraficos[idCanvas] = new Chart(contexto, config);
};

// Dibuja los 5 gráficos del panel de análisis. A diferencia de
// renderizarTabla/renderizarAnalisis, recibe siempre el historial
// COMPLETO: cada gráfico recorta lo que necesita puertas adentro
// (tendencia y conversión usan todo el historial; día/tipo y
// distribución por tipo usan solo el mes en curso; vendedores usa
// los últimos 3 meses), así que no tiene sentido pre-filtrar antes.
const renderizarGraficos = function (pericias) {
  // --- 1. Tendencia mensual (línea, historial completo) ---
  const tendencia = agruparPorMes(pericias);
  crearOActualizarGrafico("chart-tendencia-mensual", {
    type: "line",
    data: {
      labels: tendencia.labels,
      datasets: [{
        label: "Perizie al mese",
        data: tendencia.data,
        borderColor: coloresTipo.perizia,
        backgroundColor: coloresTipo.perizia,
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
    },
  });

  // --- 2. Perizie per giorno, apiladas por tipo (mes en curso) ---
  const mesEnCurso = filtrarMesEnCurso(pericias);
  const porDia = agruparPorDiaYTipo(mesEnCurso);
  crearOActualizarGrafico("chart-dia-tipo", {
    type: "bar",
    data: {
      labels: porDia.labels,
      datasets: [
        { label: "Perizia", data: porDia.perizia, backgroundColor: coloresTipo.perizia },
        { label: "Controperizia", data: porDia.controperizia, backgroundColor: coloresTipo.controperizia },
        { label: "Demo", data: porDia.demo, backgroundColor: coloresTipo.demo },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  });

  // --- 3. Distribución por tipo (donut, mes en curso) ---
  const porTipo = contarPorTipo(mesEnCurso);
  crearOActualizarGrafico("chart-distribucion-tipo", {
    type: "doughnut",
    data: {
      labels: ["Perizia", "Controperizia", "Demo"],
      datasets: [{
        data: [porTipo.perizia, porTipo.controperizia, porTipo.demo],
        backgroundColor: [coloresTipo.perizia, coloresTipo.controperizia, coloresTipo.demo],
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
    },
  });

  // --- 4. Conversión a segunda pericia (donut, historial completo) ---
  const conversion = contarConversion(pericias);
  crearOActualizarGrafico("chart-conversion", {
    type: "doughnut",
    data: {
      labels: ["Prima perizia", "Convertita in seconda perizia"],
      datasets: [{
        data: [conversion.unicas, conversion.convertidas],
        backgroundColor: [coloresConversion.unicas, coloresConversion.convertidas],
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
    },
  });

  // --- 5. Top 5 venditori (barras horizontales, últimos 3 meses) ---
  const ultimosTresMeses = filtrarUltimosMeses(pericias, 3);
  const topVendedores = calcularPericiasPorVendedor(ultimosTresMeses).slice(0, 5);
  crearOActualizarGrafico("chart-vendedores", {
    type: "bar",
    data: {
      labels: topVendedores.map(function (entrada) { return entrada[0]; }),
      datasets: [{
        label: "Perizie",
        data: topVendedores.map(function (entrada) { return entrada[1]; }),
        backgroundColor: coloresTipo.perizia,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
    },
  });
};

// Recalcula la vista por defecto (últimos 3 meses) y repinta tabla + análisis.
// La usamos en vez de llamar renderizarTabla()/renderizarAnalisis() sueltas,
// para no mostrar sin querer los 3 años de historial completo.
const mostrarVistaPorDefecto = function () {
  let pericias;
  const guardado = localStorage.getItem("pericias");
  if (guardado === null) {
    pericias = [];
  } else {
    pericias = JSON.parse(guardado);
  }

  const periciasRecientes = filtrarUltimosMeses(pericias, 3);

  renderizarTabla(periciasRecientes);
  renderizarAnalisis(periciasRecientes);
  renderizarGraficos(pericias); // usa el historial completo, no periciasRecientes
};


// ============================================
// REFERENCIAS AL DOM Y ESTADO GLOBAL
// Se declaran una sola vez, al arrancar.
// ============================================
const tbody = document.querySelector("tbody");
const formulario = document.querySelector("form");
const buscadorTarga = document.getElementById("buscador-targa");
const inputTarga = document.getElementById("targa");
const inputConcesionaria = document.getElementById("concesionaria");
const inputVendedor = document.getElementById("vendedor");
const aplicaFiltro = document.getElementById("btn-aplicar-filtros");
const limpiarFiltro = document.getElementById("btn-limpiar-filtros");
const btnExportar = document.getElementById("btn-exportar-csv");
const btnCerrarMes = document.getElementById("btn-cerrar-mes");

let indiceEditando = null; // null = carga nueva; un número = editando esa posición del array
let periciasVisibles = []; // lo que está actualmente pintado en la tabla (todo o filtrado)


// ============================================
// VENDEDOR SEGÚN SEDE
// El select de vendedores depende de qué sede se eligió
// (vendedoresPorSede), así que se repuebla dinámicamente.
// ============================================

// Repuebla el <select> de vendedores con los de la sede recibida.
// Se usa tanto al cambiar la sede a mano (evento "change") como al
// cargar una pericia existente para editar, donde hay que repoblar
// ANTES de poder asignarle el vendedor guardado (si no, el <select>
// todavía tiene las opciones de la sede anterior y el valor no pega).
const poblarVendedoresDeSede = function (sede) {
  const vendedoresDeLaSede = vendedoresPorSede[sede];

  inputVendedor.innerHTML = "";

  if (!sede || !vendedoresDeLaSede) {
    const opcionPlaceholder = document.createElement("option");
    opcionPlaceholder.value = "";
    opcionPlaceholder.textContent = "Prima seleziona una sede";
    inputVendedor.appendChild(opcionPlaceholder);
    return;
  }

  const opcionVacia = document.createElement("option");
  opcionVacia.value = "";
  opcionVacia.textContent = "Seleziona venditore";
  inputVendedor.appendChild(opcionVacia);

  for (const nombre of vendedoresDeLaSede) {
    const opcion = document.createElement("option");
    opcion.value = nombre;
    opcion.textContent = nombre;
    inputVendedor.appendChild(opcion);
  }
};

inputConcesionaria.addEventListener("change", (e) => {
  poblarVendedoresDeSede(e.target.value);
});

// Población del filtro "Venditore" (panel de filtros): todos los
// vendedores de todas las sedes juntos, sin duplicados y ordenados
// alfabéticamente (acá no depende de ninguna sede, es un filtro global).
const filtroVendedorSelect = document.getElementById("filtro-venditore");
const todosLosVendedores = [...new Set(Object.values(vendedoresPorSede).flat())].sort();

for (const nombre of todosLosVendedores) {
  const opcion = document.createElement("option");
  opcion.value = nombre;
  opcion.textContent = nombre;
  filtroVendedorSelect.appendChild(opcion);
}


// ============================================
// CARRUSEL DE GRÁFICOS
// Los 5 gráficos del panel de análisis se muestran de a uno,
// deslizando con flechas o los puntos indicadores.
// ============================================
const carruselTrack = document.getElementById("graficos-track");
const carruselAnterior = document.getElementById("carousel-anterior");
const carruselSiguiente = document.getElementById("carousel-siguiente");
const carruselIndicadores = document.getElementById("carousel-indicadores");

let indiceGraficoActual = 0;
const cantidadGraficos = carruselTrack.children.length;

// Un punto indicador por gráfico, clickeable para saltar directo a ese.
for (let i = 0; i < cantidadGraficos; i++) {
  const punto = document.createElement("button");
  punto.type = "button";
  punto.setAttribute("aria-label", `Vai al grafico ${i + 1}`);
  punto.addEventListener("click", () => irAGrafico(i));
  carruselIndicadores.appendChild(punto);
}

// Desliza el carrusel al gráfico "indice", con vuelta circular
// (después del último vuelve al primero y viceversa), y marca
// el punto indicador correspondiente como activo.
const irAGrafico = function (indice) {
  if (indice < 0) {
    indice = cantidadGraficos - 1;
  } else if (indice >= cantidadGraficos) {
    indice = 0;
  }

  indiceGraficoActual = indice;
  carruselTrack.style.transform = `translateX(-${indice * 100}%)`;

  const puntos = carruselIndicadores.children;
  for (let i = 0; i < puntos.length; i++) {
    puntos[i].classList.toggle("activo", i === indice);
  }
};

carruselAnterior.addEventListener("click", () => irAGrafico(indiceGraficoActual - 1));
carruselSiguiente.addEventListener("click", () => irAGrafico(indiceGraficoActual + 1));

irAGrafico(0); // estado inicial

// primer pintado, apenas carga la página
mostrarVistaPorDefecto();


// ============================================
// CERRAR MES
// Guarda un resumen (mes + total) como checkpoint informativo.
// YA NO vacía el detalle de pericias: "pericias" pasó a ser
// el registro único y permanente de todo el historial.
// ============================================
btnCerrarMes.addEventListener("click", (e) => {
  const confirmado = confirm("Sei sicuro di voler chiudere il mese?");
  if (!confirmado) {
    return;
  }

  let pericias;
  const guardado = localStorage.getItem("pericias");
  if (guardado === null) {
    pericias = [];
  } else {
    pericias = JSON.parse(guardado);
  }

  // arma el mes actual en formato "YYYY-MM"
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mesNumero = hoy.getMonth() + 1; // getMonth() da 0-11, se ajusta a 1-12
  const mesFormateado = String(mesNumero).padStart(2, "0"); // asegura 2 dígitos
  const mes = `${año}-${mesFormateado}`;

  // cuenta solo las pericias de ESTE mes (el array ya no se vacía,
  // así que hay que filtrar por fecha en vez de usar pericias.length)
  const periciasDeEsteMes = pericias.filter(function (pericia) {
    return pericia.fecha && pericia.fecha.startsWith(mes);
  });

  const resumen = { mes: mes, total: periciasDeEsteMes.length };

  let resumenMensual;
  const guardadoResumen = localStorage.getItem("resumenMensual");
  if (guardadoResumen === null) {
    resumenMensual = [];
  } else {
    resumenMensual = JSON.parse(guardadoResumen);
  }

  resumenMensual.push(resumen);
  localStorage.setItem("resumenMensual", JSON.stringify(resumenMensual));

  // NOTA: ya no se vacía "pericias" acá. El detalle completo se conserva.

  mostrarVistaPorDefecto();
});


// ============================================
// EXPORTAR CSV
// Arma un archivo de texto separado por comas
// con lo que esté actualmente visible en la tabla,
// y dispara la descarga con Blob + link simulado.
// ============================================
btnExportar.addEventListener("click", (e) => {
  let contenidoCSV = "Targa,Marca,Sede,Venditore,Data,Tipo,Note\n";

  for (const pericia of periciasVisibles) {
    contenidoCSV += `${pericia.targa},${pericia.brand},${pericia.concesionaria},${pericia.vendedor},${pericia.fecha},${pericia.tipo},${pericia.notas}\n`;
  }

  const blob = new Blob([contenidoCSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "pericias.csv";
  link.click();
});


// ============================================
// FILTROS Y BÚSQUEDA
// ============================================

// Vacía los 3 campos de filtro y vuelve a mostrar la vista por defecto.
limpiarFiltro.addEventListener("click", (e) => {
  const mesSeleccionado = document.getElementById("filtro-mese");
  const vendedorSeleccionado = document.getElementById("filtro-venditore");
  const tipoSeleccionado = document.getElementById("filtro-tipo");

  mesSeleccionado.value = "";
  vendedorSeleccionado.value = "";
  tipoSeleccionado.value = "";

  mostrarVistaPorDefecto();
});

// Filtro combinado: mes + vendedor + tipo, todos opcionales
// y combinados con lógica "Y" (deben cumplirse todos a la vez).
aplicaFiltro.addEventListener("click", (e) => {
  e.preventDefault();

  let pericias;
  const guardado = localStorage.getItem("pericias");
  if (guardado === null) {
    pericias = [];
  } else {
    pericias = JSON.parse(guardado);
  }

  const mesSeleccionado = document.getElementById("filtro-mese").value;
  const vendedorSeleccionado = document.getElementById("filtro-venditore").value;
  const tipoSeleccionado = document.getElementById("filtro-tipo").value;

  const periciasFiltradas = pericias.filter(function (pericia) {
    // si el filtro está vacío, la condición pasa siempre
    const cumpleTipo = tipoSeleccionado === "" || pericia.tipo === tipoSeleccionado;
    const cumpleVendedor = vendedorSeleccionado === "" || pericia.vendedor === vendedorSeleccionado;
    const cumpleMes = mesSeleccionado === "" || pericia.fecha.startsWith(mesSeleccionado);

    return cumpleTipo && cumpleVendedor && cumpleMes;
  });

  renderizarTabla(periciasFiltradas);
});

// Fuerza mayúsculas mientras se escribe la targa en el formulario.
inputTarga.addEventListener("input", (e) => {
  e.target.value = e.target.value.toUpperCase();
});

// Búsqueda rápida por targa, filtrando en vivo mientras se escribe.
buscadorTarga.addEventListener("input", (e) => {
  let pericias;
  const guardado = localStorage.getItem("pericias");
  if (guardado === null) {
    pericias = [];
  } else {
    pericias = JSON.parse(guardado);
  }

  const periciasFiltradas = pericias.filter(function (pericia) {
    return pericia.targa.toUpperCase().includes(e.target.value.toUpperCase());
  });

  renderizarTabla(periciasFiltradas);
});


// ============================================
// ACCIONES SOBRE FILAS DE LA TABLA
// Un solo listener en el tbody (delegación de eventos),
// porque los botones se generan dinámicamente y no
// existen todavía cuando este script se ejecuta.
// ============================================
tbody.addEventListener("click", (e) => {
  // --- Eliminar ---
  if (e.target.classList.contains("btn-eliminar")) {
    const confirmado = confirm("Sei sicuro di voler eliminare questa perizia?");
    if (!confirmado) {
      return;
    }

    const index = Number(e.target.dataset.index);

    let pericias;
    const guardado = localStorage.getItem("pericias");
    if (guardado === null) {
      pericias = [];
    } else {
      pericias = JSON.parse(guardado);
    }

    pericias.splice(index, 1); // saca 1 elemento en la posición "index"
    localStorage.setItem("pericias", JSON.stringify(pericias));
    mostrarVistaPorDefecto();
  }

  // --- Editar ---
  if (e.target.classList.contains("btn-editar")) {
    const index = Number(e.target.dataset.index);

    let pericias;
    const guardado = localStorage.getItem("pericias");
    if (guardado === null) {
      pericias = [];
    } else {
      pericias = JSON.parse(guardado);
    }

    const pericia = pericias[index];

    // carga los datos de esa pericia de vuelta en el formulario
    document.getElementById("targa").value = pericia.targa;
    document.getElementById("brand").value = pericia.brand;
    document.getElementById("concesionaria").value = pericia.concesionaria;
    poblarVendedoresDeSede(pericia.concesionaria); // repuebla antes de asignar, si no el value no pega
    document.getElementById("vendedor").value = pericia.vendedor;
    document.getElementById("fecha").value = pericia.fecha;
    document.getElementById("notas").value = pericia.notas;
    formulario.querySelector(`input[name="tipo"][value="${pericia.tipo}"]`).checked = true;

    // marca que el próximo submit debe actualizar esta posición, no crear una nueva
    indiceEditando = index;
  }
});


// ============================================
// GUARDAR PERICIA (submit del formulario)
// Valida cada campo con la Constraint Validation API,
// y si todo es válido, crea o actualiza la pericia
// en localStorage según indiceEditando.
// ============================================
formulario.addEventListener("submit", (e) => {
  e.preventDefault();

  let formularioValido = true;

  // recorre todos los campos del form y muestra un
  // mensaje de error específico por cada uno inválido
  for (const campo of formulario.elements) {
    if (campo.tagName === "BUTTON") continue;
    if (campo.type === "radio") continue;
    if (campo.id === "notas") continue; // opcional, nunca falla
    if (campo.tagName === "FIELDSET") continue; // no es un campo de datos

    const spanError = document.getElementById(`${campo.id}-error`);

    if (!campo.validity.valid) {
      let mensaje = "";

      if (campo.validity.valueMissing) {
        mensaje = "Questo campo è obbligatorio";
      } else if (campo.validity.patternMismatch) {
        mensaje = "Formato non valido";
      }
      formularioValido = false;
      spanError.textContent = mensaje;
    } else {
      spanError.textContent = "";
    }
  }

  // los radio buttons se manejan aparte del loop,
  // porque son un solo grupo lógico (name="tipo")
  const spanErrorTipo = document.getElementById("tipo-error");
  const algunTipoMarcado = formulario.querySelector('input[name="tipo"]:checked');

  if (!algunTipoMarcado) {
    spanErrorTipo.textContent = "Devi selezionare un tipo";
    formularioValido = false;
  } else {
    spanErrorTipo.textContent = "";
  }

  if (formularioValido) {
    const targa = document.getElementById("targa").value;
    const brand = document.getElementById("brand").value;
    const concesionaria = document.getElementById("concesionaria").value;
    const vendedor = document.getElementById("vendedor").value;
    const fecha = document.getElementById("fecha").value;
    const notas = document.getElementById("notas").value;
    const tipo = algunTipoMarcado.value;

    const pericia = {
      targa: targa,
      brand: brand,
      concesionaria: concesionaria,
      vendedor: vendedor,
      fecha: fecha,
      tipo: tipo,
      notas: notas,
    };

    let pericias;
    const guardado = localStorage.getItem("pericias");
    if (guardado === null) {
      pericias = [];
    } else {
      pericias = JSON.parse(guardado);
    }

    if (indiceEditando === null) {
      pericias.push(pericia); // carga nueva
    } else {
      pericias[indiceEditando] = pericia; // actualiza la existente
    }

    localStorage.setItem("pericias", JSON.stringify(pericias));

    const spanCargaExitosa = document.getElementById("carga-exitosa");
    spanCargaExitosa.textContent = "Perizia salvata";

    mostrarVistaPorDefecto();
    formulario.reset();
    indiceEditando = null; // vuelve a modo "carga nueva"
  }
});