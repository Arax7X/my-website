# my-website

A small collection of static web pages I built while learning HTML, CSS, and
JavaScript. Everything is plain HTML with inline styles and scripts — no build
step and no dependencies.

## Pages

| File | What it is |
|------|------------|
| [`index.html`](index.html) | A single-page personal portfolio — intro, about, skills, a JavaScript-rendered projects list, and contact details. |
| [`landing.html`](landing.html) | "Nova", a modern marketing landing page template with hero, features, testimonials, and pricing sections. |
| [`todo.html`](todo.html) | A browser-based to-do app (details below). |

## To-do app features

`todo.html` is a self-contained to-do list that saves tasks in the browser's
`localStorage`, so they persist between visits. It supports:

- Add, edit (double-click a task), and delete tasks
- Click a task to toggle it done
- Filter by All / Active / Done
- Search tasks by text
- Drag and drop to reorder
- Export all tasks to a JSON file
- A live "tasks left" counter

## Viewing the site

These are static files, so you can open any `.html` file directly in your
browser. To view them the way they'd be served on the web, run a simple local
server from the project folder:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/> in your browser.
