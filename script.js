const tasks = [];

const addTaskBtn = document.getElementById("addTaskBtn");

addTaskBtn.addEventListener("click", addTask);

function addTask(){

  const title =
    document.getElementById("taskTitle").value;

  const date =
    document.getElementById("taskDate").value;

  const category =
    document.getElementById("taskCategory").value;

  const status =
    document.getElementById("taskStatus").value;

  if(title === ""){
    alert("Please enter task title");
    return;
  }

  const task = {
    title,
    date,
    category,
    status
  };

  tasks.push(task);

  renderTasks();

  updateDashboard();

  clearForm();
}

function renderTasks(){

  const taskList =
    document.getElementById("taskList");

  taskList.innerHTML = "";

  tasks.forEach((task,index)=>{

    const card =
      document.createElement("div");

    let statusClass = "";

    if(task.status === "Pending"){
      statusClass = "pending-task";
    }

    else if(task.status === "In Progress"){
      statusClass = "progress-task";
    }

    else{
      statusClass = "completed-task";
    }

    card.className =
      `task-card ${statusClass}`;

    card.innerHTML = `
      <h3>${task.title}</h3>

      <p><strong>Date:</strong> ${task.date}</p>

      <p><strong>Category:</strong> ${task.category}</p>

      <p><strong>Status:</strong> ${task.status}</p>
    `;

    taskList.appendChild(card);
  });
}

function updateDashboard(){

  const total = tasks.length;

  const pending =
    tasks.filter(task =>
      task.status === "Pending"
    ).length;

  const progress =
    tasks.filter(task =>
      task.status === "In Progress"
    ).length;

  const completed =
    tasks.filter(task =>
      task.status === "Completed"
    ).length;

  document.getElementById("statTotal")
    .textContent = total;

  document.getElementById("statPending")
    .textContent = pending;

  document.getElementById("statProgress")
    .textContent = progress;

  document.getElementById("statDone")
    .textContent = completed;

  let percent = 0;

  if(total > 0){
    percent =
      Math.round(
        (completed / total) * 100
      );
  }

  document.getElementById("progressFill")
    .style.width = percent + "%";

  document.getElementById("progressPct")
    .textContent =
      percent + "% Completed";
}

function clearForm(){

  document.getElementById("taskTitle")
    .value = "";

  document.getElementById("taskDate")
    .value = "";

  document.getElementById("taskStatus")
    .value = "Pending";
}