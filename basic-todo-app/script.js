const todoForm = document.getElementById("addTodoForm");
const divElem = document.getElementById("todoContainer");
const pendingTodosElem = document.getElementById("pendingTodos");
const completedTodosElem = document.getElementById("completedTodos");
const addInputElem = document.getElementById("addTodoInput");
const searchInputElem = document.getElementById("searchTodoInput");
const buttonElem = document.getElementById("addTodoButton");
const pendingLengthElem = document.getElementById("pendingTodosLength");
const completedLengthElem = document.getElementById("completedTodosLength");

let todoData = {};

// Adding liseners to the required elements
todoForm.addEventListener("submit", handleSubmit);
addInputElem.addEventListener("keyup", handleAddInputOnKeyUp);
searchInputElem.addEventListener("keyup", handleSearchInputOnKeyUp);

function todoElemIdGenerator() {
    const todoElementsLength =
        Object.keys(todoData)[Object.keys(todoData).length - 1] || 0;
    return Number(todoElementsLength) + 1;
}

function todoElemCreator(
    id,
    text,
    state = "pending",
    highlight = { activate: false },
    animate = false
) {
    const todoElem = document.createElement("li");
    todoElem.setAttribute(
        "class",
        `todo list-group-item px-3 py-1 my-1 ${
            animate && "animate__animated animate__backInDown"
        }`
    );
    state === "completed" && todoElem.classList.add("completed");
    todoElem.setAttribute("id", "todo-" + id);

    let highlightedText = text;
    if (highlight.activate && highlight.regex) {
        highlightedText = text.replace(
            highlight.regex,
            (match) => `<mark>${match}</mark>`
        );
    }

    todoElem.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <label for="completeTodo-check-${id}">${highlightedText}</label>
            <div class="todo-options">
                <button class="todoDelete btn btn-transparent d-flex justify-content-center align-items-center"><i class="fa-solid fa-xmark fs-5"></i></button>
                <input id="completeTodo-check-${id}" type="checkbox" name="completeTodo" class="todoComplete form-check-input mt-0 rounded-circle p-2" ${
        state === "completed" ? "checked" : ""
    }>
            </div>
        </div>
    `;

    todoElem
        .querySelector(".todoDelete")
        .addEventListener("click", function () {
            todoElem.classList.add(
                "animate__animated",
                "animate__backOutRight"
            );

            setTimeout(function () {
                todoElem.remove();
                delete todoData[id];
                localStorage.setItem("todoData", JSON.stringify(todoData));
                todosLengthRenderer();
            }, 500);
        });

    todoElem
        .querySelector(".todoComplete")
        .addEventListener("change", function (e) {
            if (this.checked) {
                todoElem.classList.remove("animate__backInUp");
                todoElem.classList.add(
                    "animate__animated",
                    "animate__backOutDown"
                );

                setTimeout(function () {
                    todoElem.remove();
                    todoElem.classList.remove("animate__backOutDown");
                    todoElem.classList.add("completed", "animate__backInDown");
                    completedTodosElem.insertAdjacentElement(
                        "afterbegin",
                        todoElem
                    );
                    todoData[id].state = "completed";
                    localStorage.setItem("todoData", JSON.stringify(todoData));
                    todosLengthRenderer();

                    setTimeout(() => {
                        todoElem.classList.remove("animate__backInDown")
                    }, 500);
                }, 500);
            } else {
                todoElem.classList.remove("animate__backInDown");
                todoElem.classList.add(
                    "animate__animated",
                    "animate__backOutUp"
                );
                setTimeout(() => {
                    todoElem.remove();
                    todoElem.classList.remove(
                        "completed",
                        "animate__backOutUp"
                    );
                    todoElem.classList.add("animate__backInUp");
                    pendingTodosElem.insertAdjacentElement(
                        "afterbegin",
                        todoElem
                    );
                    todoData[id].state = "pending";
                    localStorage.setItem("todoData", JSON.stringify(todoData));
                    todosLengthRenderer();

                    setTimeout(() => {
                        todoElem.classList.remove("animate__backInUp")
                    }, 500);
                }, 500);
            }
        });

    return todoElem;
}

function searchTodos(query) {
    completedTodosElem.innerHTML = "";
    pendingTodosElem.innerHTML = "";

    if (query.trim() !== "") {
        const keywords = query.split(" ").filter(Boolean);
        const searchPattern = keywords
            .map((keyword) => `(?=.*${keyword})`)
            .join("");
        const searchRegex = new RegExp(searchPattern, "ig");

        const highlightPattern = keywords.join("|");
        const highlightRegex = new RegExp(highlightPattern, "ig");

        const foundInTodo = Object.values(todoData).filter((todo) =>
            searchRegex.test(todo.text)
        );

        todoRenderInBulk(foundInTodo, {
            regex: highlightRegex,
            activate: true,
        });
    } else {
        todoRenderInBulk(Object.values(todoData));
    }
}

function todoElemDistributor(todoElem, state = "pending") {
    if (state === "pending") {
        pendingTodosElem.insertAdjacentElement("afterbegin", todoElem);
    } else if (state === "completed") {
        completedTodosElem.insertAdjacentElement("afterbegin", todoElem);
    }
    todosLengthRenderer();
}

// Restore data from Local Storage if exist
window.onload = (e) => {
    if (localStorage.getItem("todoData")) {
        todoData = JSON.parse(localStorage.getItem("todoData"));
        // todoData is defined but if there is nothing
        if (!Object.values(todoData).length) {
            todoData = obj;
        }
    } else {
        todoData = obj;
    }
    todoRenderInBulk(Object.values(todoData));
};

function handleSubmit(e) {
    e.preventDefault();
    if (addInputElem.value.trim()) {
        const todoElemId = todoElemIdGenerator();
        const todoElem = todoElemCreator(
            todoElemId,
            addInputElem.value,
            "pending",
            {},
            true
        );
        todoElemDistributor(todoElem, "pending");
        todoData = {
            ...todoData,
            [todoElemId]: {
                id: todoElemId,
                text: addInputElem.value,
                state: "pending",
            },
        };
        localStorage.setItem("todoData", JSON.stringify(todoData));
        buttonElem.setAttribute("disabled", "");
        addInputElem.value = "";
    }
}

function handleAddInputOnKeyUp(e) {
    if (e.target.value) {
        buttonElem.removeAttribute("disabled");
    } else {
        buttonElem.setAttribute("disabled", "");
    }
}

function handleSearchInputOnKeyUp(e) {
    searchTodos(e.target.value);
}

function todoRenderInBulk(todoData, regexOptions = { activate: false }) {
    const { regex, activate } = regexOptions;

    todoData.forEach((todo) => {
        let todoElem;
        if (activate && regex) {
            todoElem = todoElemCreator(todo.id, todo.text, todo.state, {
                regex,
                activate: true,
            });
        } else {
            todoElem = todoElemCreator(todo.id, todo.text, todo.state);
        }

        todoElemDistributor(todoElem, todo.state);
    });
    todosLengthRenderer();
}

function todosLengthRenderer() {
    console.log();
    pendingLengthElem.innerText = pendingTodosElem.childElementCount;
    completedLengthElem.innerText = completedTodosElem.childElementCount;
}

// Data to intialize app for the first if does not exist.
const obj = {
    1: {
        id: 1,
        text: "Create MongoDB collections using Mongoose schemas",
        state: "completed",
    },
    2: {
        id: 2,
        text: "Implement Redux actions and reducers for state management",
        state: "pending",
    },
    3: {
        id: 3,
        text: "Build reusable React components for the user interface",
        state: "completed",
    },
    4: {
        id: 4,
        text: "Develop backend API endpoints using Java and MongoDB",
        state: "completed",
    },
    5: {
        id: 5,
        text: "Write JavaScript functions to handle application logic",
        state: "pending",
    },
    6: {
        id: 6,
        text: "Adopt TypeScript for type-safe coding in the project",
        state: "completed",
    },
    7: {
        id: 7,
        text: "Perform CRUD operations in MongoDB using Mongoose",
        state: "completed",
    },
    8: {
        id: 8,
        text: "Utilize Redux middleware for async actions and side effects",
        state: "pending",
    },
    9: {
        id: 9,
        text: "Optimize React component rendering for better performance",
        state: "completed",
    },
    10: {
        id: 10,
        text: "Integrate Java libraries for enhanced functionality in the backend",
        state: "completed",
    },
    11: {
        id: 11,
        text: "Use MongoDB with Mongoose for data storage",
        state: "completed",
    },
    12: {
        id: 12,
        text: "Integrate Redux for state management in the app",
        state: "pending",
    },
    13: {
        id: 13,
        text: "Build responsive UI using React",
        state: "completed",
    },
    14: {
        id: 14,
        text: "Develop Java backend for the application",
        state: "completed",
    },
    15: {
        id: 15,
        text: "Implement JavaScript logic for frontend functionalities",
        state: "pending",
    },
    16: {
        id: 16,
        text: "Migrate the codebase from JavaScript to TypeScript",
        state: "completed",
    },
};
