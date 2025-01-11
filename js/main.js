// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCbWio8rerVcId4k3WGDhrKuahOj2t2v9I",
  authDomain: "app-fitfusion.firebaseapp.com",
  projectId: "app-fitfusion",
  storageBucket: "app-fitfusion.appspot.com",
  messagingSenderId: "61815565821",
  appId: "1:61815565821:web:52334725ccd5c6896bbd94",
};

// Inicializar o Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(); // Obter o auth do Firebase
const db = firebase.firestore(); // Obter o Firestore
const presetsCollection = db.collection("presets");
const usersCollection = db.collection("users");

let currentWorkouts = []; // Lista de treinos do preset atual

// Botão "+ Novo Treino" para adicionar treinos
document.getElementById("addWorkout").addEventListener("click", () => {
  const newWorkoutField = document.createElement("div");
  newWorkoutField.classList.add("workoutField", "mb-3");

  const workoutLabel = document.createElement("label");
  workoutLabel.textContent = "Dia da Semana:";
  workoutLabel.style.fontWeight = "bold";

  const workoutNameInput = document.createElement("input");
  workoutNameInput.type = "text";
  workoutNameInput.classList.add("workoutName", "form-control");
  workoutNameInput.placeholder = "Exemplo: Segunda-Feira";

  const exerciseFields = document.createElement("div");
  exerciseFields.classList.add("exerciseFields", "mt-3");

  newWorkoutField.appendChild(workoutLabel);
  newWorkoutField.appendChild(workoutNameInput);
  newWorkoutField.appendChild(exerciseFields);

  document.getElementById("workoutFields").appendChild(newWorkoutField);
});

// Botão "+ Adicionar Exercício" para adicionar exercícios ao último treino criado
document.getElementById("addExerciseGlobal").addEventListener("click", () => {
  const workoutFields = document.getElementById("workoutFields");
  const lastWorkoutField = workoutFields.lastElementChild; // Seleciona o último treino adicionado

  if (lastWorkoutField) {
    const exerciseFields = lastWorkoutField.querySelector(".exerciseFields");

    const newExerciseField = document.createElement("div");
    newExerciseField.classList.add("exerciseField", "mb-2");

    const exerciseLabel = document.createElement("label");
    exerciseLabel.textContent = "Nome do Exercício:";
    exerciseLabel.style.fontWeight = "bold";

    const newExerciseInput = document.createElement("input");
    newExerciseInput.type = "text";
    newExerciseInput.classList.add("exerciseName", "form-control");
    newExerciseInput.placeholder = "Exemplo: Supino Reto";

    newExerciseField.appendChild(exerciseLabel);
    newExerciseField.appendChild(newExerciseInput);
    exerciseFields.appendChild(newExerciseField);
  } else {
    alert("Adicione um Dia da Semana antes de inserir exercícios.");
  }
});

// Salvar o preset no Firestore
document.getElementById("savePreset").addEventListener("click", async () => {
  const presetName = document.getElementById("presetName").value;

  // Obter todos os treinos inseridos
  const workoutFields = document.querySelectorAll(".workoutField");
  const workouts = [];

  workoutFields.forEach((field) => {
    const name = field.querySelector(".workoutName").value.trim();
    const exerciseFields = field.querySelectorAll(".exerciseField");

    const exercises = [];
    exerciseFields.forEach((exerciseField) => {
      const exerciseName = exerciseField
        .querySelector(".exerciseName")
        .value.trim();
      if (exerciseName) {
        exercises.push(exerciseName);
      }
    });

    if (name && exercises.length > 0) {
      workouts.push({ name, exercises });
    }
  });

  // Verificar se o nome do preset e os treinos foram preenchidos corretamente
  if (presetName && workouts.length > 0) {
    try {
      // Obter o e-mail do usuário logado (Firebase Authentication)
      const user = firebase.auth().currentUser;
      if (!user) {
        alert("Você precisa estar logado para salvar o preset.");
        return;
      }
      const userEmail = user.email;

      // Adicionar o preset no Firestore com o e-mail do usuário
      await presetsCollection.add({
        name: presetName,
        workouts,
        registeredAcademy: userEmail, // Adicionando o campo 'registeredAcademy'
      });

      alert("Preset salvo com sucesso!");
      document.getElementById("presetName").value = "";
      document.getElementById("workoutFields").innerHTML = "";
      displayPresets();
    } catch (error) {
      console.error("Erro ao salvar preset:", error);
    }
  } else {
    alert(
      "Preencha o nome do preset e adicione pelo menos um treino com exercícios!"
    );
  }
});

// Função para exibir os presets apenas se o usuário estiver logado
async function displayPresets() {
  const presetListContainer = document.getElementById("presetListContainer");

  presetListContainer.innerHTML = ""; // Limpar a lista de cards

  try {
    // Obter o e-mail do usuário logado
    const user = firebase.auth().currentUser;

    const userEmail = user.email;

    // Filtrar presets com base no e-mail do usuário logado
    const querySnapshot = await presetsCollection
      .where("registeredAcademy", "==", userEmail) // Filtro pelo e-mail do usuário
      .get();

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const card = document.createElement("div");
      card.className = "preset-card";

      // Criar conteúdo do card
      const workoutDetails = data.workouts
        .map(
          (workout) =>
            `<li><strong>${workout.name}</strong>: 
                          <ul>${workout.exercises
              .map((ex) => `<li>${ex}</li>`)
              .join("")}</ul></li>`
        )
        .join(" ");

      card.innerHTML = `
                  <h5 class="preset-title">
                      ${data.name}
                      <button onclick="deletePreset('${doc.id}')" class="delete-btn" style="color: red; background-color: none; border: none;">
                        <i class="fas fa-trash-alt"></i>
                      </button>
                  </h5>
                  <ul>${workoutDetails}</ul>
              `;

      // Adicionar o card à lista
      presetListContainer.appendChild(card);
    });

    // Se nenhum preset for encontrado, exibir mensagem
    if (querySnapshot.empty) {
      presetListContainer.innerHTML = "<p>Nenhum preset encontrado.</p>";
    }
  } catch (error) {

  }
}

// Monitorar o estado de autenticação
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // Usuário está logado
    console.log("Usuário logado: ", user.email);
    // Exibir os presets após o login
    displayPresets();
  } else {
    // Usuário não está logado
    console.log("Usuário não logado");
    alert("Você precisa estar logado para visualizar os presets.");
  }
});

// Excluir um preset
window.deletePreset = async (id) => {
  if (confirm("Tem certeza que deseja excluir este preset?")) {
    try {
      await presetsCollection.doc(id).delete();
      alert("Preset excluído com sucesso!");
      displayPresets();
    } catch (error) {
      console.error("Erro ao excluir preset:", error);
    }
  }
};

// Função para exibir os usuários e seus presets atribuídos
async function displayAssignedUsers() {
  const currentUser = firebase.auth().currentUser;

  const assignedUsersTableBody = document
    .getElementById("assignedUsersTable")
    .getElementsByTagName("tbody")[0];

  assignedUsersTableBody.innerHTML = ""; // Limpar a tabela

  try {
    // Buscar todos os presets
    const presetsSnapshot = await db.collection("presets").get();
    const presetsMap = new Map();

    // Armazenar os presets em um Map para referência rápida
    presetsSnapshot.forEach((presetDoc) => {
      const presetData = presetDoc.data();
      presetsMap.set(presetDoc.id, presetData.name); // Mapeia o ID do preset para seu nome
    });

    // Buscar todos os usuários com o campo registeredAcademy igual ao email do usuário logado
    const usersSnapshot = await db
      .collection("users")
      .where("registeredAcademy", "==", currentUser.email) // Filtra pelo campo registeredAcademy
      .get();

    // Para cada usuário, exibir o preset atribuído
    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      const userEmail = userData.email;
      const assignedPresetId = userData.presetAssigned;

      if (assignedPresetId && presetsMap.has(assignedPresetId)) {
        const presetName = presetsMap.get(assignedPresetId);

        // Criar uma nova linha para cada usuário
        const row = assignedUsersTableBody.insertRow();
        row.classList.add("user-row"); // Classe para controle de filtro

        const userCell = row.insertCell(0);
        userCell.textContent = userEmail;

        const presetCell = row.insertCell(1);
        presetCell.textContent = presetName;
      }
    });
  } catch (error) {

  }
}

// Verifica se o usuário está autenticado antes de exibir os dados
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    displayAssignedUsers();
  }
});

// Filtro de busca
document
  .getElementById("searchAssignedUsers")
  .addEventListener("input", function () {
    const filter = this.value.toLowerCase(); // Valor da busca
    const rows = document.querySelectorAll("#assignedUsersTable .user-row");

    rows.forEach((row) => {
      const userCell = row.cells[0].textContent.toLowerCase();
      const presetCell = row.cells[1].textContent.toLowerCase();

      if (userCell.includes(filter) || presetCell.includes(filter)) {
        row.style.display = ""; // Mostrar linha
      } else {
        row.style.display = "none"; // Ocultar linha
      }
    });
  });

// Chamar a função para exibir os usuários e presets atribuídos
document.addEventListener("DOMContentLoaded", displayAssignedUsers);

// Carregar os presets no seletor de atribuição, filtrando pelo campo registeredAcademy
async function loadPresets() {
  const currentUser = firebase.auth().currentUser;

  const presetSelect = document.getElementById("presetSelect");
  presetSelect.innerHTML = ""; // Limpar o seletor

  try {
    // Buscar os presets que possuem o campo registeredAcademy com o email do usuário logado
    const presetsSnapshot = await db
      .collection("presets")
      .where("registeredAcademy", "==", currentUser.email) // Filtra pelos presets que possuem o email logado
      .get();

    presetsSnapshot.forEach((doc) => {
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = doc.data().name;
      presetSelect.appendChild(option);
    });
  } catch (error) {

  }
}

// Verifica se o usuário está logado antes de carregar os presets
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    loadPresets(); // Chama a função para carregar os presets após garantir que o usuário está logado
  } else {
    alert("Você precisa estar logado para carregar os presets.");
  }
});

document.getElementById("assignPreset").addEventListener("click", async () => {
  const userEmail = document.getElementById("userEmail").value.trim();
  const presetId = document.getElementById("presetSelect").value.trim();

  if (!presetId) {
    alert("Por favor, selecione um preset para atribuir.");
    return;
  }

  // Verificar se o e-mail do usuário existe
  const userSnapshot = await usersCollection
    .where("email", "==", userEmail)
    .get();

  if (!userSnapshot.empty) {
    const userDoc = userSnapshot.docs[0];
    const userId = userDoc.id;

    try {
      // Buscar o documento do usuário
      const userData = userDoc.data();
      const currentPresetId = userData.presetAssigned;

      // Remover o usuário do preset anterior, se existir
      if (currentPresetId) {
        const previousPresetDoc = await presetsCollection
          .doc(currentPresetId)
          .get();

        if (previousPresetDoc.exists) {
          const previousPresetData = previousPresetDoc.data();
          const previousAssignedUsers = previousPresetData.assignedUser || [];

          // Remover o e-mail do usuário da lista de assignedUser
          const updatedAssignedUsers = previousAssignedUsers.filter(
            (email) => email !== userEmail
          );

          // Atualizar o preset anterior no Firestore
          await presetsCollection.doc(currentPresetId).update({
            assignedUser: updatedAssignedUsers,
          });
        }
      }

      // Atribuir o novo preset
      const presetDoc = await presetsCollection.doc(presetId).get();

      if (presetDoc.exists) {
        const presetData = presetDoc.data();
        const assignedUsers = presetData.assignedUser || [];

        // Adicionar o novo e-mail ao array assignedUser
        if (!assignedUsers.includes(userEmail)) {
          assignedUsers.push(userEmail);

          await presetsCollection.doc(presetId).update({
            assignedUser: assignedUsers,
          });

          // Atualizar o ID do preset no campo assignedPreset do usuário
          await usersCollection.doc(userId).update({
            presetAssigned: presetId, // Salvar o ID do preset
          });

          alert("Preset atribuído com sucesso!");
          displayAssignedUsers(); // Atualiza a lista de usuários atribuídos
        } else {
          alert("Este usuário já foi atribuído a este preset.");
        }
      } else {
        alert("Preset não encontrado.");
      }
    } catch (error) {
      console.error("Erro ao atribuir preset ao usuário:", error);
      alert("Erro ao atribuir preset. Verifique o console para mais detalhes.");
    }
  } else {
    document.getElementById("userExistMessage").style.display = "block";
    alert("Usuário não encontrado!");
  }
});

document
  .getElementById("registerStudent")
  .addEventListener("click", async () => {
    const studentName = document.getElementById("studentName").value.trim();
    const studentEmail = document.getElementById("studentEmail").value.trim();
    const studentPassword = document
      .getElementById("studentPassword")
      .value.trim();

    // Validar os campos
    if (!studentName || !studentEmail || !studentPassword) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    if (!studentEmail.includes("@")) {
      alert("Por favor, insira um e-mail válido.");
      return;
    }

    if (studentPassword.length < 6) {
      alert("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    const currentUser = firebase.auth().currentUser;

    if (!currentUser) {
      alert("Você precisa estar logado para cadastrar um aluno.");
      return;
    }

    try {
      // Obter o token de autenticação do administrador
      const adminToken = await currentUser.getIdToken();

      // Criar o usuário usando a API REST do Firebase Authentication
      const createUserResponse = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyCbWio8rerVcId4k3WGDhrKuahOj2t2v9I`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: studentEmail,
            password: studentPassword,
            returnSecureToken: false,
          }),
        }
      );

      if (!createUserResponse.ok) {
        const errorData = await createUserResponse.json();
        throw new Error(errorData.error.message || "Erro ao criar o usuário.");
      }

      // Obter o UID do usuário criado
      const createUserResult = await createUserResponse.json();
      const newUserUID = createUserResult.localId;

      // Criar um documento na coleção 'users' com o UID do Auth
      const newUserRef = db.collection("users").doc(newUserUID);
      await newUserRef.set({
        name: studentName,
        email: studentEmail,
        registeredAcademy: currentUser.email, // O e-mail do administrador logado
      });

      alert("Aluno cadastrado com sucesso!");

      // Limpar os campos do formulário
      document.getElementById("studentName").value = "";
      document.getElementById("studentEmail").value = "";
      document.getElementById("studentPassword").value = "";
    } catch (error) {
      console.error("Erro ao cadastrar o aluno:", error);
      alert("Erro ao cadastrar o aluno. Tente novamente.");
    }
  });

// Função para exibir os alunos cadastrados
async function loadStudents() {
  const currentUser = firebase.auth().currentUser;

  try {
    // Buscar os alunos que possuem o campo registeredAcademy igual ao e-mail do usuário logado
    const snapshot = await db
      .collection("users")
      .where("registeredAcademy", "==", currentUser.email)
      .get();

    // Limpar a tabela antes de inserir os novos alunos
    const studentsList = document.getElementById("studentsList");
    studentsList.innerHTML = "";

    snapshot.forEach((doc) => {
      const studentData = doc.data();
      const studentId = doc.id;

      // Criar uma nova linha para cada aluno
      const row = document.createElement("tr");

      // Inserir os dados do aluno nas células
      row.innerHTML = `
                  <td>${studentData.name}</td>
                  <td>${studentData.email}</td>
                  <td>
    <button class="btn btn-sm" style="color: black; background-color: none; border: none;" 
            value="${studentId}" 
            onclick="editStudent(this.value)">
        <i class="fas fa-pencil-alt"></i> <!-- Ícone de lápis -->
    </button>
    <button class="btn btn-sm" style="color: red; background-color: none; border: none;" 
            onclick="deleteStudent('${studentId}')">
        <i class="fas fa-trash-alt"></i> <!-- Ícone de lixeira -->
    </button>
</td>
              `;

      // Adicionar a linha à tabela
      studentsList.appendChild(row);
    });
  } catch (error) {

  }
}

function createEditStudentModal(studentData) {
  console.log("ID do aluno ao criar modal:", studentData.id);

  return `
          <div class="modal" id="editStudentModal" tabindex="-1" role="dialog" aria-labelledby="editStudentModalLabel" aria-hidden="true">
              <div class="modal-dialog" role="document">
                  <div class="modal-content">
                      <!-- Cabeçalho com a faixa verde -->
                      <div class="modal-header custom-header">
                          <h5 class="modal-title" id="editStudentModalLabel">Editar Aluno</h5>
                          <button type="button" class="close custom-close" data-dismiss="modal" aria-label="Close" onclick="closeModal()">
                              <span aria-hidden="true">&times;</span>
                          </button>
                      </div>
                      <div class="modal-body d-flex flex-column">
                          <form id="editStudentForm" class="flex-grow-1">
                              <!-- Campo invisível para armazenar o ID do aluno -->
                              <input type="hidden" id="studentId" value="${studentData.id || ""
    }">
                              
                              <div class="form-group">
                                  <label for="studentName">Nome</label>
                                  <input type="text" class="form-control" id="studentName" value="${studentData.name || ""
    }" required>
                              </div>
                              <div class="form-group">
                                  <label for="studentEmail">Email</label>
                                  <input type="email" class="form-control" id="studentEmail" value="${studentData.email || ""
    }" required>
                              </div>
                              <div class="form-group">
                                  <label for="studentPassword">Senha</label>
                                  <input type="password" class="form-control" id="studentPassword" value="" placeholder="Deixe em branco para não alterar">
                              </div>
                          </form>
                          <!-- O botão será posicionado no final da div modal-body -->
                          <button type="button" class="btn btn-primary btn-save mt-3 ml-auto d-block" onclick="saveStudentChanges()">Salvar alterações</button>
                      </div>
                  </div>
              </div>
          </div>
        `;
}

function editStudent(studentId) {
  console.log("ID do aluno recebido pelo botão:", studentId);

  const studentRef = db.collection("users").doc(studentId);

  studentRef
    .get()
    .then((doc) => {
      if (doc.exists) {
        const studentData = doc.data();
        studentData.id = studentId; // Adiciona o ID ao objeto de dados do aluno
        console.log("Aluno encontrado:", studentData);

        // Remover o modal existente (se houver) antes de criar um novo
        const existingModal = document.getElementById("editStudentModal");
        if (existingModal) {
          existingModal.remove();
        }

        // Gerar o HTML do modal e inseri-lo no DOM
        const modalHTML = createEditStudentModal(studentData);
        document.body.insertAdjacentHTML("beforeend", modalHTML);

        // Exibir o modal com os dados preenchidos
        openModalWithData();
      } else {
        console.error("Aluno não encontrado com o ID:", studentId);
        alert("Aluno não encontrado.");
      }
    })
    .catch((error) => {
      console.error("Erro ao carregar os dados do aluno:", error);
      alert(
        "Erro ao carregar os dados do aluno. Verifique o console para mais detalhes."
      );
    });
}

// Função para abrir o modal com os dados preenchidos
function openModalWithData() {
  try {
    var myModal = new bootstrap.Modal(
      document.getElementById("editStudentModal")
    );
    myModal.show(); // Exibe o modal
  } catch (error) {
    console.error("Erro ao abrir o modal:", error);
  }
}

async function saveStudentChanges() {
  const studentId = document.getElementById("studentId").value;

  if (!studentId) {
    console.error("ID do aluno não fornecido!");
    alert("Erro: ID do aluno não encontrado.");
    return;
  }

  // Obter os valores dos campos após edição
  const studentNameInput = document.getElementById("studentName");
  const studentEmailInput = document.getElementById("studentEmail");
  const studentPasswordInput = document.getElementById("studentPassword");

  const newName = studentNameInput.value.trim();
  const newEmail = studentEmailInput.value.trim();
  const newPassword = studentPasswordInput.value.trim();

  console.log("Valores enviados para salvar:", {
    newName,
    newEmail,
    newPassword,
  });

  try {
    // Referência ao Firestore
    const studentRef = db.collection("users").doc(studentId);

    // Obter os dados atuais do Firestore
    const doc = await studentRef.get();
    if (!doc.exists) {
      console.error("Aluno não encontrado com o ID:", studentId);
      alert("Aluno não encontrado.");
      return;
    }

    const studentData = doc.data();
    const updatedData = {};

    // Verificar alterações e preparar o objeto updatedData
    if (newName && newName !== studentData.name.trim()) {
      updatedData.name = newName;
    }

    if (newEmail && newEmail !== studentData.email.trim()) {
      updatedData.email = newEmail;
    }

    if (Object.keys(updatedData).length > 0) {
      console.log("Atualizando dados no Firestore:", updatedData);
      await studentRef.update(updatedData);
      console.log("Dados atualizados no Firestore:", updatedData);
    } else {
      console.log("Nenhuma alteração detectada no Firestore.");
    }

    // Atualizar no Firebase Authentication se necessário
    const user = firebase.auth().currentUser;
    if (newEmail && newEmail !== studentData.email) {
      try {
        await user.updateEmail(newEmail);
        console.log("E-mail atualizado no Firebase Authentication.");
      } catch (error) {
        console.error(
          "Erro ao atualizar e-mail no Firebase Authentication:",
          error
        );
        alert("Erro ao atualizar e-mail no Firebase Authentication.");
        return;
      }
    }

    if (newPassword) {
      try {
        await user.updatePassword(newPassword);
        console.log("Senha atualizada no Firebase Authentication.");
      } catch (error) {
        console.error(
          "Erro ao atualizar senha no Firebase Authentication:",
          error
        );
        alert("Erro ao atualizar senha no Firebase Authentication.");
        return;
      }
    }

    // Atualizar os valores nos campos de input
    studentNameInput.value = newName || studentData.name;
    studentEmailInput.value = newEmail || studentData.email;

    // Fechar o modal
    closeModal();
    alert("Alterações salvas com sucesso!");
  } catch (error) {
    console.error("Erro ao salvar as alterações:", error);
    alert(
      "Erro ao salvar as alterações. Verifique o console para mais detalhes."
    );
  }
}

// Função para fechar o modal e limpar os campos
function closeModal() {
  try {
    // Limpar os campos do modal
    const studentName = document.getElementById("studentName");
    const studentEmail = document.getElementById("studentEmail");
    const studentPassword = document.getElementById("studentPassword");

    if (studentName && studentEmail && studentPassword) {
      studentName.value = "";
      studentEmail.value = "";
      studentPassword.value = "";
    }

    // Fechar o modal
    const modalElement = document.getElementById("editStudentModal");
    if (modalElement) {
      var myModal = bootstrap.Modal.getInstance(modalElement);
      if (myModal) {
        myModal.hide(); // Fecha o modal
      }

      // Remover o modal do DOM após fechar
      modalElement.remove(); // Remove o modal do DOM
    }

    // Remover o backdrop do DOM
    const backdropElements = document.querySelectorAll(".modal-backdrop");
    backdropElements.forEach((backdrop) => backdrop.remove()); // Remove todos os elementos backdrop
  } catch (error) {
    console.error("Erro ao fechar o modal:", error);
  }
}

// Função para excluir um aluno
function deleteStudent(studentId) {
  if (confirm("Tem certeza de que deseja excluir este aluno?")) {
    const studentRef = db.collection("users").doc(studentId);

    studentRef
      .delete()
      .then(() => {
        console.log("Aluno excluído com sucesso.");
        alert("Aluno excluído com sucesso.");
        loadStudents(); // Recarregar a lista de alunos
      })
      .catch((error) => {
        console.error("Erro ao excluir aluno:", error);
        alert("Erro ao excluir aluno.");
      });
  }
}

// Verificar o estado de autenticação quando a página carregar
firebase.auth().onAuthStateChanged(async (user) => {
  if (user) {
    // O usuário está autenticado
    loadStudents(); // Carregar a lista de alunos
  } else {
    // O usuário não está autenticado
    console.log("Usuário não autenticado.");
    alert("Você precisa estar logado para visualizar os alunos.");
  }
});

// Função para filtrar alunos pela barra de pesquisa
document
  .getElementById("searchStudents")
  .addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase(); // Pega o valor da pesquisa em minúsculas
    const rows = document.querySelectorAll("#studentsList tr"); // Seleciona todas as linhas da tabela

    rows.forEach((row) => {
      const name = row
        .querySelector("td:nth-child(1)")
        .textContent.toLowerCase(); // Nome do aluno
      const email = row
        .querySelector("td:nth-child(2)")
        .textContent.toLowerCase(); // E-mail do aluno

      // Verifica se o nome ou e-mail contém o termo de pesquisa
      if (name.includes(searchTerm) || email.includes(searchTerm)) {
        row.style.display = ""; // Exibe a linha
      } else {
        row.style.display = "none"; // Oculta a linha
      }
    });
  });

// Exibir os presets e os usuários atribuídos ao carregar a página
window.onload = async () => {
  displayPresets(); // Exibir presets
  displayAssignedUsers(); // Exibir usuários com presets atribuídos
  loadPresets(); // Carregar presets para o seletor de atribuição
  loadStudents();
};
