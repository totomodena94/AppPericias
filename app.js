const vendedoresPorSede = {
  "salaria-nuovo": ["Barcilli", "Terzuoli", "Rossi", "Rossi Sciarra", "Montecchi", "Panetta", "Scrima", "Pileggi", "Gutu", "Felli", "Geamana", "Antinucci", "Fratesi", "Miele", "Mari"],
  "salaria-usato": ["Grasso", "Corradini", "D'Angelo", "Pellini", "Serafini"],
  "appia-nuovo": [],
  "appia-usato": [],
};


const renderizarTabla = function(periciasARenderizar){
  const filaTabla = document.querySelector("tbody");
  let pericias;

  if(periciasARenderizar === undefined){
    const guardado = localStorage.getItem("pericias");
    if (guardado === null) {
        pericias = [];
    } else {
        pericias = JSON.parse(guardado);
    }
    }else{
      pericias = periciasARenderizar;
    }

    let contenidoTabla = "";

    for(const [index, pericia] of pericias.entries()){
      contenidoTabla += `
      <tr>
        <td>${pericia.targa}</td>
        <td>${pericia.brand}</td>
        <td>${pericia.concesionaria}</td>
        <td>${pericia.vendedor}</td>
        <td>${pericia.fecha}</td>
        <td>${pericia.tipo}</td>
        <td>${pericia.notas}</td>
        <td>
          <button class="btn-eliminar" data-index="${index}">Elimina</button>
          <button class="btn-editar" data-index="${index}">Edita</button>
        </td>

      </tr>
      `;

    
    }
  filaTabla.innerHTML = contenidoTabla;

};



const tbody = document.querySelector("tbody");
const formulario = document.querySelector("form");
const buscadorTarga = document.getElementById("buscador-targa");
const inputTarga = document.getElementById("targa")
const aplicaFiltro = document.getElementById("btn-aplicar-filtros");
const limpiarFiltro = document.getElementById("btn-limpiar-filtros");
let indiceEditando = null;
renderizarTabla();


limpiarFiltro.addEventListener("click", (e) =>{
  const mesSeleccionado = document.getElementById("filtro-mese");
    const vendedorSeleccionado = document.getElementById("filtro-venditore");
    const tipoSeleccionado = document.getElementById("filtro-tipo");

    mesSeleccionado.value = "";
    vendedorSeleccionado.value = "";
    tipoSeleccionado.value = "";

    renderizarTabla();

})

aplicaFiltro.addEventListener("click", (e) =>{
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

const periciasFiltradas = pericias.filter(function(pericia) {
    const cumpleTipo = tipoSeleccionado === "" || pericia.tipo === tipoSeleccionado;
    const cumpleVendedor = vendedorSeleccionado === "" || pericia.vendedor === vendedorSeleccionado;
    const cumpleMes = mesSeleccionado === "" || pericia.fecha.startsWith(mesSeleccionado);

    return cumpleTipo && cumpleVendedor && cumpleMes;
});
renderizarTabla(periciasFiltradas);

})


inputTarga.addEventListener("input", (e) =>{
  e.target.value = e.target.value.toUpperCase();
})

buscadorTarga.addEventListener("input", (e) =>{
let pericias;
    const guardado = localStorage.getItem("pericias");
    if (guardado === null) {
        pericias = [];
    } else {
        pericias = JSON.parse(guardado);
    }

const periciasFiltradas = pericias.filter(function(pericia){
  return pericia.targa.toUpperCase().includes(e.target.value.toUpperCase());
});

renderizarTabla(periciasFiltradas);


})


tbody.addEventListener("click", (e) =>{
if(e.target.classList.contains("btn-eliminar")){
  const index = Number(e.target.dataset.index);

  let pericias;
    const guardado = localStorage.getItem("pericias");
    if (guardado === null) {
        pericias = [];
    } else {
        pericias = JSON.parse(guardado);
    }

    pericias.splice(index, 1);
  localStorage.setItem("pericias", JSON.stringify(pericias));
  renderizarTabla();

}

if(e.target.classList.contains("btn-editar")){
  const index = Number(e.target.dataset.index);

  let pericias;
    const guardado = localStorage.getItem("pericias");
    if (guardado === null) {
        pericias = [];
    } else {
        pericias = JSON.parse(guardado);
    }
    const pericia = pericias[index];
    document.getElementById("targa").value = pericia.targa;
    document.getElementById("brand").value = pericia.brand;
    document.getElementById("concesionaria").value = pericia.concesionaria;
    document.getElementById("vendedor").value = pericia.vendedor;
    document.getElementById("fecha").value = pericia.fecha;
    document.getElementById("notas").value = pericia.notas;
    formulario.querySelector(`input[name="tipo"][value="${pericia.tipo}"]`).checked = true;

    indiceEditando = index;
  }
});

formulario.addEventListener("submit", (e) =>{
  e.preventDefault();

  let formularioValido = true;

  for (const campo of formulario.elements){
  if(campo.tagName === "BUTTON") continue;
  if(campo.type === "radio") continue;
  if (campo.id === "notas") continue;
  if (campo.tagName === "FIELDSET") continue;

  const spanError = document.getElementById(`${campo.id}-error`);

  if(!campo.validity.valid){
    let mensaje = "";

    if(campo.validity.valueMissing){
      mensaje = "Questo campo è obbligatorio";
    } else if(campo.validity.patternMismatch){
      mensaje = "Formato non valido"
    }
    formularioValido = false;
    spanError.textContent = mensaje;

  }else{
    spanError.textContent = "";
    
  }
}

const spanErrorTipo = document.getElementById("tipo-error");
const algunTipoMarcado = formulario.querySelector('input[name="tipo"]:checked');

if(!algunTipoMarcado){
  spanErrorTipo.textContent = "Devi selezionare un tipo";
  formularioValido = false;
} else {
    spanErrorTipo.textContent = "";
}

if(formularioValido){

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
  notas: notas

};
let pericias;
const guardado = localStorage.getItem("pericias");
if(guardado === null){
  pericias = [];
}else{
  pericias = JSON.parse(guardado);
}

if(indiceEditando === null){
pericias.push(pericia);
} else {
  pericias[indiceEditando] = pericia;
}
localStorage.setItem("pericias", JSON.stringify(pericias));

const spanCargaExitosa= document.getElementById("carga-exitosa");

spanCargaExitosa.textContent = "Perizia salvata";
renderizarTabla();
formulario.reset();
indiceEditando = null;




}
});

