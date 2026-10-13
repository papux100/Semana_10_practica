# Mi panel con DummyJSON

Página con HTML, CSS y JavaScript puro que usa la API de [DummyJSON](https://dummyjson.com/docs).

- Página: `https://<tu-usuario>.github.io/<tu-repositorio>/`
- Usuario de prueba: `emilys` / `emilyspass`

## Métodos de arreglo

| Método   | Dónde                            | Para qué |
|----------|----------------------------------|----------|
| `reduce` | `pintar()`                       | Contar las tareas completadas. |
| `filter` | `pintar()`                       | Aplicar el filtro (Todas/Pendientes/Completadas) y el buscador. |
| `filter` | `eliminarTarea()`                | Quitar la tarea eliminada del arreglo. |
| `sort`   | `pintar()`                       | Ordenar las tareas por nombre. |
| `map`    | `pintar()`                       | Convertir cada tarea en un `<li>`. |
| `find`   | `cambiarEstado()` y `eliminarTarea()` | Buscar la tarea por su `id`. |
