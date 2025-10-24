document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Datos de ejemplo
  const activities = {
    1: {
      id: 1,
      title: "Clase de Yoga al Aire Libre",
      participants: [
        { id: 1, name: "Ana", avatar: "https://i.pravatar.cc/40?img=3" },
        { id: 2, name: "Luis", avatar: "https://i.pravatar.cc/40?img=12" },
        { id: 3, name: "María J.", initial: "MJ" },
        { id: 4, name: "Omar", avatar: "https://i.pravatar.cc/40?img=5" },
        { id: 5, name: "Carlos R.", initial: "CR" },
      ],
    },
    // Más actividades aquí...
  };

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and select options
      activitiesList.innerHTML = "";
      // Mantener la opción por defecto y limpiar el resto
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHtml = details.participants.map(email => `
          <li>
            ${email}
            <button class="delete-participant" data-activity="${name}" data-email="${email}" title="Remove participant">×</button>
          </li>
        `).join('');

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <div class="participants-header">
              <div class="participants-title">Participants</div>
              <div class="participant-count">${details.participants.length}</div>
            </div>
            <div class="participants-list">
              ${participantsHtml}
            </div>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Renderizar lista de participantes
  function renderParticipants(activityId) {
    const activity = activities[activityId];
    if (!activity) return;

    const listEl = document.getElementById(`participants-list-${activityId}`);
    const countEl = listEl.closest(".participants-section").querySelector(".participant-count");

    // Actualizar contador
    countEl.textContent = activity.participants.length;

    // Renderizar participantes
    listEl.innerHTML = activity.participants.map((p) => `
        <li>
            ${p.avatar 
                ? `<img class="avatar" src="${p.avatar}" alt="${p.name}" />` 
                : `<span class="participant-initial">${p.initial}</span>`
            }
            ${p.name}
        </li>
    `).join("");
  }

  // Unirse a actividad
  function joinActivity(activityId, participant) {
    const activity = activities[activityId];
    if (!activity) return;

    // Evitar duplicados
    if (!activity.participants.find((p) => p.id === participant.id)) {
      activity.participants.push(participant);
      renderParticipants(activityId);
    }
  }

  // Abandonar actividad
  function leaveActivity(activityId, participantId) {
    const activity = activities[activityId];
    if (!activity) return;

    activity.participants = activity.participants.filter((p) => p.id !== participantId);
    renderParticipants(activityId);
  }

  // Handle unregistering a participant
  async function unregisterParticipant(activity, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        // Refresh the activities to show updated participant list
        await fetchActivities();
        messageDiv.textContent = "Successfully unregistered from the activity";
        messageDiv.className = "success";
      } else {
        const result = await response.json();
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    if (!activity) {
      messageDiv.textContent = "Please select an activity";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      return;
    }

    try {
      // Deshabilitar el formulario mientras se procesa
      const submitButton = signupForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = "Signing up...";

      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to show new participant
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Restaurar el botón
      submitButton.disabled = false;
      submitButton.textContent = "Sign Up";

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Handle delete participant clicks
  document.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.delete-participant');
    if (!deleteBtn) return;

    const activity = deleteBtn.dataset.activity;
    const email = deleteBtn.dataset.email;

    if (confirm(`¿Estás seguro de que deseas eliminar a ${email} de ${activity}?`)) {
      await unregisterParticipant(activity, email);
    }
  });

  // Inicializar
  fetchActivities();

  // Manejar clicks en botón unirse
  document.addEventListener("click", (e) => {
    const joinBtn = e.target.closest("button:not(.participants-toggle)");
    if (!joinBtn) return;

    const section = joinBtn.closest(".activity-card");
    const activityId = section.dataset.activityId;

    // Simular usuario actual
    const currentUser = {
      id: Date.now(),
      name: "Usuario Nuevo",
      initial: "UN",
    };

    if (joinBtn.classList.contains("joined")) {
      leaveActivity(activityId, currentUser.id);
      joinBtn.textContent = "Unirse";
      joinBtn.classList.remove("joined");
    } else {
      joinActivity(activityId, currentUser);
      joinBtn.textContent = "Abandonar";
      joinBtn.classList.add("joined");
    }
  });
});
