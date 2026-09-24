const vendedoresPorSede = {
  "salaria-nuovo": ["Barcilli", "Terzuoli", "Rossi", "Rossi Sciarra", "Montecchi", "Panetta", "Scrima", "Pileggi", "Gutu", "Felli", "Geamana", "Antinucci", "Fratesi", "Miele", "Mari"],
  "salaria-usato": ["Grasso", "Corradini", "D'Angelo", "Pellini", "Tommaso"],
  "appia-nuovo": [],
  "appia-usato": [],
};


const renderizarTabla = function(){
  const filaTabla = document.querySelector("tbody");
  let pericias;
    const guardado = localStorage.getItem("pericias");
    if (guardado === null) {
        pericias = [];
    } else {
        pericias = JSON.parse(guardado);
    }

    let contenidoTabla = "";

    for(const pericia of pericias){
      contenidoTabla += `
      <tr>
        <td>${pericia.targa}</td>
        <td>${pericia.brand}</td>
        <td>${pericia.concesionaria}</td>
        <td>${pericia.vendedor}</td>
        <td>${pericia.fecha}</td>
        <td>${pericia.tipo}</td>
        <td>${pericia.notas}</td>

      </tr>
      `;

    
    }
  filaTabla.innerHTML = contenidoTabla;

};

renderizarTabla();



const formulario = document.querySelector("form");

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
pericias.push(pericia);
localStorage.setItem("pericias", JSON.stringify(pericias));

const spanCargaExitosa= document.getElementById("carga-exitosa");

spanCargaExitosa.textContent = "Perizia salvata";
renderizarTabla();
formulario.reset();




}
});

