const GAS_URL =
  "https://script.google.com/macros/s/AKfycbxdMqh-OF1FDbGPbu28Awt9j5-PRUyIbhJg_e8qZh1BQnBPrUw0STESkwYgAZblDg/exec";

let masterData = null;

document.addEventListener("DOMContentLoaded", async () => {

  document.getElementById("workDate").value =
    new Date().toISOString().split("T")[0];

  await loadMaster();

  addRequest();
});

async function loadMaster() {

  const res = await fetch(`${GAS_URL}?action=master`);
  masterData = await res.json();

  loadStaff();
  loadLessonSlots();
  loadCleaning();
}

function loadStaff() {

  const select = document.getElementById("staff");

  select.innerHTML =
    '<option value="">選択してください</option>';

  masterData.staffs.forEach(staff => {

    const option = document.createElement("option");

    option.value = staff.name;
    option.textContent = staff.name;

    select.appendChild(option);
  });
}

function loadLessonSlots() {

  const container =
    document.getElementById("lessonSlots");

  container.innerHTML = "";

  masterData.lessonSlots.forEach(slot => {

    container.innerHTML += `
      <label>
        <input
          type="checkbox"
          name="lessonSlot"
          value="${slot}"
          onchange="toggleMallPro()"
        >
        ${slot}
      </label><br>
    `;
  });
}

function loadCleaning() {

  const container =
    document.getElementById("cleaningArea");

  container.innerHTML = "";

  const groups = {};

  masterData.cleanings.forEach(item => {

    if (!groups[item.category]) {
      groups[item.category] = [];
    }

    groups[item.category].push(item);
  });

  Object.keys(groups).forEach(category => {

    container.innerHTML += `
      <h3>${category}</h3>
    `;

    groups[category].forEach(item => {

      container.innerHTML += `
        <label>
          <input
            type="checkbox"
            class="cleaning"
            data-column="${item.columnName}"
          >
          ${item.name}
        </label><br>
      `;
    });
  });
}

function toggleMallPro() {

  const checked = [
    ...document.querySelectorAll(
      'input[name="lessonSlot"]:checked'
    )
  ].map(x => x.value);

  const section =
    document.getElementById("mallProSection");

  if (checked.includes("20:00～20:45")) {
    section.style.display = "block";
  } else {
    section.style.display = "none";
    document.getElementById("mallProDone").checked = false;
  }
}

function addRequest() {

  const container =
    document.getElementById("requestContainer");

  const div = document.createElement("div");

  div.className = "request-item";

  div.innerHTML = `
    <hr>

    <select class="requestType">
      <option value="要望">要望</option>
      <option value="クレーム">クレーム</option>
    </select>

    <input
      type="text"
      class="memberName"
      placeholder="会員名"
    >

    <textarea
      class="requestContent"
      placeholder="内容"
    ></textarea>

    <textarea
      class="requestResponse"
      placeholder="対応内容"
    ></textarea>
  `;

  container.appendChild(div);
}

async function submitReport() {

  const btn =
    document.getElementById("submitBtn");

  btn.disabled = true;
  btn.textContent = "送信中...";

  try {

    const lessonSlots = [
      ...document.querySelectorAll(
        'input[name="lessonSlot"]:checked'
      )
    ].map(x => x.value);

    const cleaning = {};

    document
      .querySelectorAll(".cleaning")
      .forEach(item => {

        if (item.checked) {
          cleaning[item.dataset.column] = true;
        }
      });

    const requests = [];

    document
      .querySelectorAll(".request-item")
      .forEach(item => {

        requests.push({
          type:
            item.querySelector(".requestType").value,

          memberName:
            item.querySelector(".memberName").value,

          content:
            item.querySelector(".requestContent").value,

          response:
            item.querySelector(".requestResponse").value
        });
      });

    const data = {

      workDate:
        document.getElementById("workDate").value,

      staff:
        document.getElementById("staff").value,

      lessonSlots,

      memberCount:
        document.getElementById("memberCount").value,

      cleaning,

      requests,

      equipmentIssue:
        document.querySelector(
          'input[name="equipmentIssue"]:checked'
        ).value,

      equipmentDetail:
        document.getElementById("equipmentDetail").value,

      equipmentUrgency:
        document.getElementById("equipmentUrgency").value,

      equipmentPhotoUrl: "",

      supplyIssue:
        document.querySelector(
          'input[name="supplyIssue"]:checked'
        ).value,

      supplyDetail:
        document.getElementById("supplyDetail").value,

      handover:
        document.getElementById("handover").value,

      comment:
        document.getElementById("comment").value,

      mallProDone:
        document.getElementById("mallProDone").checked
    };

    const res = await fetch(GAS_URL, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (result.success) {

      alert(
        `送信完了\n\n日報ID:${result.reportId}`
      );

      location.reload();

    } else {

      alert(result.error || "送信失敗");
    }

  } catch (e) {

    alert(e.message);

  } finally {

    btn.disabled = false;
    btn.textContent = "日報を送信する";
  }
}
