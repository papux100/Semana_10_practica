const API = 'https://dummyjson.com';

let usuario = null; // datos del usuario logueado
let tareas = [];    // tareas guardadas en el navegador

// Elementos del HTML
const login = document.querySelector('#login');
const panel = document.querySelector('#panel');
const formLogin = document.querySelector('#form-login');
const inputUsuario = document.querySelector('#usuario');
const inputPassword = document.querySelector('#password');
const btnLogin = document.querySelector('#btn-login');
const error = document.querySelector('#error');
const perfil = document.querySelector('#perfil');
const btnSalir = document.querySelector('#btn-salir');
const contadores = document.querySelector('#contadores');
const formTarea = document.querySelector('#form-tarea');
const nueva = document.querySelector('#nueva');
const filtro = document.querySelector('#filtro');
const buscar = document.querySelector('#buscar');
const mensaje = document.querySelector('#mensaje');
const lista = document.querySelector('#lista');

// Muestra el login o el panel
function mostrar(vista) {
  login.hidden = vista !== 'login';
  panel.hidden = vista !== 'panel';
}

//Iniciar sesión 
async function iniciarSesion(e) {
  e.preventDefault(); 
  btnLogin.disabled = true;
  btnLogin.textContent = 'Entrando…';
  error.textContent = '';

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: inputUsuario.value,
        password: inputPassword.value
      })
    });

    if (!res.ok) {
      error.textContent = 'Usuario o contraseña incorrectos';
      return;
    }

    const data = await res.json();
    localStorage.setItem('token', data.accessToken);
    cargarPerfil();
  } catch (err) {
    error.textContent = 'Error de conexión';
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = 'Entrar';
  }
}

function cerrarSesion() {
  localStorage.removeItem('token');
  usuario = null;
  tareas = [];
  mostrar('login');
}

//Perfil
async function cargarPerfil() {
  try {
    const res = await fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    if (res.status === 401) {
      cerrarSesion();
      return;
    }
    if (!res.ok) throw new Error('Error ' + res.status);

    usuario = await res.json();
    perfil.innerHTML = `
      <img src="${usuario.image}" alt="Foto">
      <h2>${usuario.firstName} ${usuario.lastName}</h2>
      <p>${usuario.email}</p>
      <p>Edad: ${usuario.age}</p>
      <p>Teléfono: ${usuario.phone}</p>
    `;
    mostrar('panel');
    cargarTareas();
  } catch (err) {
    error.textContent = 'No se pudo cargar el perfil';
    mostrar('login');
  }
}

//Tareas 
async function cargarTareas() {
  try {
    const res = await fetch(`${API}/todos/user/${usuario.id}`);
    if (!res.ok) throw new Error('Error ' + res.status);

    const data = await res.json();
    tareas = data.todos;
    pintar();
  } catch (err) {
    mensaje.textContent = 'No se pudieron cargar las tareas';
  }
}

function pintar() {
  const completadas = tareas.reduce((total, t) => t.completed ? total + 1 : total, 0);
  const pendientes = tareas.length - completadas;
  const porcentaje = tareas.length ? Math.round(completadas / tareas.length * 100) : 0;

  contadores.textContent =
    `Total: ${tareas.length} | Completadas: ${completadas} | Pendientes: ${pendientes} | Avance: ${porcentaje}%`;

  const texto = buscar.value.toLowerCase();

  // filter: aplica el filtro y la búsqueda
  // sort: ordena por nombre (filter ya hizo una copia, no se altera "tareas")
  const visibles = tareas
    .filter(t => {
      if (filtro.value === 'pendientes') return !t.completed;
      if (filtro.value === 'completadas') return t.completed;
      return true;
    })
    .filter(t => t.todo.toLowerCase().includes(texto))
    .sort((a, b) => a.todo.localeCompare(b.todo));

  // map: convierte cada tarea en un <li>
  lista.innerHTML = visibles.map(t => `
    <li class="${t.completed ? 'hecha' : ''}">
      <input type="checkbox" data-id="${t.id}" ${t.completed ? 'checked' : ''}>
      <span>${t.todo}</span>
      <button data-id="${t.id}">Eliminar</button>
    </li>
  `).join('');
}

//Acciones
async function agregarTarea(e) {
  e.preventDefault();
  const texto = nueva.value.trim();
  if (!texto) return;

  try {
    const res = await fetch(`${API}/todos/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ todo: texto, completed: false, userId: usuario.id })
    });
    if (!res.ok) throw new Error('Error ' + res.status);

    const tarea = await res.json();
    tarea.id = Date.now(); // DummyJSON siempre regresa el mismo id
    tarea.local = true;    // no existe en el servidor
    tareas.push(tarea);
    nueva.value = '';
    mensaje.textContent = '';
    pintar();
  } catch (err) {
    mensaje.textContent = 'No se pudo agregar la tarea';
  }
}

async function cambiarEstado(id) {
  // find: busca la tarea por su id
  const tarea = tareas.find(t => t.id === id);

  try {
    // Las tareas locales solo se cambian en el arreglo
    if (!tarea.local) {
      const res = await fetch(`${API}/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !tarea.completed })
      });
      if (!res.ok) throw new Error('Error ' + res.status);
    }
    tarea.completed = !tarea.completed;
    mensaje.textContent = '';
  } catch (err) {
    mensaje.textContent = 'No se pudo actualizar la tarea';
  }
  pintar();
}

async function eliminarTarea(id) {
  const tarea = tareas.find(t => t.id === id);

  try {
    if (!tarea.local) {
      const res = await fetch(`${API}/todos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error ' + res.status);
    }
    // filter: se queda con todas menos la eliminada
    tareas = tareas.filter(t => t.id !== id);
    mensaje.textContent = '';
    pintar();
  } catch (err) {
    mensaje.textContent = 'No se pudo eliminar la tarea';
  }
}

//Eventos 
formLogin.addEventListener('submit', iniciarSesion);
btnSalir.addEventListener('click', cerrarSesion);
formTarea.addEventListener('submit', agregarTarea);
filtro.addEventListener('change', pintar);
buscar.addEventListener('input', pintar);

// Un solo evento para todas las tareas de la lista
lista.addEventListener('click', e => {
  const id = Number(e.target.dataset.id);
  if (e.target.type === 'checkbox') cambiarEstado(id);
  if (e.target.tagName === 'BUTTON') eliminarTarea(id);
});

// Al cargar la página: si hay token, entra directo
if (localStorage.getItem('token')) {
  cargarPerfil();
}