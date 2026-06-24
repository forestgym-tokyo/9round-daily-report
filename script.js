const GAS_URL =
  "https://script.google.com/macros/s/AKfycbxdMqh-OF1FDbGPbu28Awt9j5-PRUyIbhJg_e8qZh1BQnBPrUw0STESkwYgAZblDg/exec";

let masterData = null;

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("workDate").value =
    new Date().toISOString().split("T")[0];

  await loadMaster();

  addRequest();
  addLostItem();
  addEquipmentIssue();
  addSupplyIssue();
});

function loadMaster() {
  return new Promise((resolve, reject) => {
    const callbackName = "masterCallback_" + Date.now();

    window[callbackName] = function(data) {
      masterData = data;

      loadStaff();
      loadLessonSlots();
      loadCleaning();

      delete window[callbackName];
      script.remove();

      resolve();
    };

    const script = document.createElement("script");
    script.src = `${GAS_URL}?action=master&callback=${callbackName}`;
    script.onerror = reject;

    document.body.appendChild(script);
  });
}

function loadStaff() {
  const select = document.getElementById("staff");
  select.innerHTML = '<option value="">選択してください</option>';

  masterData.staffs.forEach(staff => {
    const option = document.createElement("option");
    option.value = staff.name;
    option.textContent = staff.name;
    select.appendChild(option);
  });
}

function loadLessonSlots() {
  const container = document.getElementById("lessonSlots");
  container.innerHTML = "";

  masterData.lessonSlots.forEach(slot => {
    container.innerHTML += `
      <div class="slot-row">
        <label>
          <input
            type="checkbox"
            name="lessonSlot"
            value="${slot}"
            onchange="toggleMallPro(); updateMemberTotal();"
          >
          ${slot}
        </label>

        <input
          type="number"
          class="slot-count"
          data-slot="${slot}"
          min="0"
          placeholder="人数"
          oninput="updateMemberTotal()"
        >
      </div>
    `;
  });
}

function updateMemberTotal() {
  let total = 0;

  document.querySelectorAll(".slot-count").forEach(input => {
    total += Number(input.value || 0);
  });

  document.getElementById("memberCount").value = total;
}

function loadCleaning() {
  const container = document.getElementById("cleaningArea");
  container.innerHTML = "";

  const groups = {};

  masterData.cleanings.forEach(item => {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  });

  Object.keys(groups).forEach(category => {
    container.innerHTML += `<h3>${category}</h3>`;

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
    ...document.querySelectorAll('input[name="lessonSlot"]:checked')
  ].map(x => x.value);

  const section = document.getElementById("mallProSection");

  if (checked.includes("20:00～20:45")) {
    section.style.display = "block";
  } else {
    section.style.display = "none";
    document.getElementById("mallProDone").checked = false;
  }
}

function addRequest() {
  const container = document.getElementById("requestContainer");
  const div = document.createElement("div");
  div.className = "request-item";

  div.innerHTML = `
    <hr>

    <select class="requestType">
      <option value="要望">要望</option>
      <option value="クレーム">クレーム</option>
    </select>

    <input type="text" class="memberName" placeholder="会員名">

    <textarea class="requestContent" placeholder="内容"></textarea>

    <textarea class="requestResponse" placeholder="対応内容"></textarea>

    <button type="button" onclick="removeBlock(this)">
      この要望・クレームを削除
    </button>
  `;

  container.appendChild(div);
}

function addLostItem() {
  const container = document.getElementById("lostItemContainer");
  const div = document.createElement("div");
  div.className = "lost-item";

  div.innerHTML = `
    <hr>

    <select class="lostOwnerType" onchange="toggleLostOwnerName(this)">
      <option value="不明">持ち主不明</option>
      <option value="判明">持ち主判明</option>
    </select>

    <input
      type="text"
      class="lostOwnerName"
      placeholder="会員様名"
      style="display:none;"
    >

    <textarea class="lostContent" placeholder="忘れ物"></textarea>

    <select class="lostStatus">
      <option value="未届出">未届出</option>
      <option value="届出済">届出済</option>
    </select>

    <input type="file" class="lostPhoto" accept="image/*">

    <textarea class="lostNote" placeholder="備考"></textarea>

    <button type="button" onclick="removeBlock(this)">
      この忘れ物を削除
    </button>
  `;

  container.appendChild(div);
}

function toggleLostOwnerName(select) {
  const item = select.closest(".lost-item");
  const input = item.querySelector(".lostOwnerName");

  if (select.value === "判明") {
    input.style.display = "block";
  } else {
    input.style.display = "none";
    input.value = "";
  }
}

function addEquipmentIssue() {
  const container = document.getElementById("equipmentContainer");
  const div = document.createElement("div");
  div.className = "equipment-item";

  div.innerHTML = `
    <hr>

    <textarea class="equipmentDetail" placeholder="設備異常内容"></textarea>

    <select class="equipmentUrgency">
      <option value="">緊急度選択</option>
      <option value="低">低</option>
      <option value="中">中</option>
      <option value="高">高</option>
    </select>

    <input type="file" class="equipmentPhoto" accept="image/*">

    <button type="button" onclick="removeBlock(this)">
      この設備異常を削除
    </button>
  `;

  container.appendChild(div);
}

function addSupplyIssue() {
  const container = document.getElementById("supplyContainer");
  const div = document.createElement("div");
  div.className = "supply-item";

  div.innerHTML = `
    <hr>

    <textarea class="supplyDetail" placeholder="備品破損・不足内容"></textarea>

    <input type="file" class="supplyPhoto" accept="image/*">

    <button type="button" onclick="removeBlock(this)">
      この備品破損・不足を削除
    </button>
  `;

  container.appendChild(div);
}

function removeBlock(button) {
  const block = button.closest(
    ".request-item, .lost-item, .equipment-item, .supply-item"
  );

  if (block) block.remove();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(",")[1];

      resolve({
        name: file.name,
        type: file.type,
        data: base64
      });
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function submitReport() {
  const btn = document.getElementById("submitBtn");

  btn.disabled = true;
  btn.textContent = "送信中...";

  try {
    const lessonSlots = [
      ...document.querySelectorAll('input[name="lessonSlot"]:checked')
    ].map(x => x.value);

    const lessonCounts = {};

    document.querySelectorAll(".slot-count").forEach(input => {
      lessonCounts[input.dataset.slot] = input.value || "";
    });

    const cleaning = {};

    document.querySelectorAll(".cleaning").forEach(item => {
      if (item.checked) {
        cleaning[item.dataset.column] = true;
      }
    });

    const requests = [];

    document.querySelectorAll(".request-item").forEach(item => {
      const content = item.querySelector(".requestContent").value.trim();
      if (!content) return;

      requests.push({
        type: item.querySelector(".requestType").value,
        memberName: item.querySelector(".memberName").value,
        content: content,
        response: item.querySelector(".requestResponse").value
      });
    });

    const lostItems = [];

    for (const item of document.querySelectorAll(".lost-item")) {
      const content = item.querySelector(".lostContent").value.trim();
      if (!content) continue;

      const file = item.querySelector(".lostPhoto").files[0];

      lostItems.push({
        ownerType: item.querySelector(".lostOwnerType").value,
        ownerName: item.querySelector(".lostOwnerName").value,
        content: content,
        storage: item.querySelector(".lostStorage").value,
        photo: await fileToBase64(file),
        note: item.querySelector(".lostNote").value
      });
    }

    const equipmentIssues = [];

    for (const item of document.querySelectorAll(".equipment-item")) {
      const detail = item.querySelector(".equipmentDetail").value.trim();
      const file = item.querySelector(".equipmentPhoto").files[0];

      if (!detail && !file) continue;

      equipmentIssues.push({
        detail: detail,
        urgency: item.querySelector(".equipmentUrgency").value,
        photo: await fileToBase64(file)
      });
    }

    const supplyIssues = [];

    for (const item of document.querySelectorAll(".supply-item")) {
      const detail = item.querySelector(".supplyDetail").value.trim();
      const file = item.querySelector(".supplyPhoto").files[0];

      if (!detail && !file) continue;

      supplyIssues.push({
        detail: detail,
        photo: await fileToBase64(file)
      });
    }

    const data = {
      workDate: document.getElementById("workDate").value,
      staff: document.getElementById("staff").value,
      lessonSlots,
      lessonCounts,
      memberCount: document.getElementById("memberCount").value,
      cleaning,
      requests,
      lostItems,
      equipmentIssues,
      supplyIssues,
      handover: document.getElementById("handover").value,
      comment: document.getElementById("comment").value,
      mallProDone: document.getElementById("mallProDone").checked
    };

    await fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify(data)
    });

    alert("送信しました。");
    location.reload();

  } catch (e) {
    alert(e.message);

  } finally {
    btn.disabled = false;
    btn.textContent = "日報を送信する";
  }
}
