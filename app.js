const STORAGE_KEY = "media-team-scheduler-v1";

const DEFAULT_DATA = {
  team: [
    {
      id: "member-1",
      name: "林夏",
      role: "内容主编",
      focus: "选题策划 / 审稿 / 发布把控",
      capacity: 6,
    },
    {
      id: "member-2",
      name: "周野",
      role: "编导",
      focus: "脚本 / 拍摄统筹",
      capacity: 5,
    },
    {
      id: "member-3",
      name: "程柚",
      role: "剪辑",
      focus: "粗剪 / 包装 / 封面节奏",
      capacity: 7,
    },
    {
      id: "member-4",
      name: "宋屿",
      role: "运营",
      focus: "排期 / 分发 / 数据复盘",
      capacity: 8,
    },
  ],
  topics: [
    {
      id: "topic-1",
      title: "AI 办公工具 7 天实测",
      contentType: "长视频",
      series: "工具评测",
      priority: "高",
      status: "脚本中",
      ownerId: "member-2",
      publishDate: "2026-03-26",
      summary: "聚焦真实团队提效，不做纯功能堆砌。",
      tags: ["AI", "效率", "测评"],
      tasks: [
        { name: "脚本定稿", dueDate: "2026-03-24", assigneeId: "member-2", done: false },
        { name: "粗剪完成", dueDate: "2026-03-25", assigneeId: "member-3", done: false },
        { name: "预约发布时间", dueDate: "2026-03-26", assigneeId: "member-4", done: false },
      ],
    },
    {
      id: "topic-2",
      title: "小红书爆款标题拆解",
      contentType: "图文",
      series: "增长拆解",
      priority: "中",
      status: "待排期",
      ownerId: "member-1",
      publishDate: "2026-03-29",
      summary: "整理 30 个高互动标题模型，输出可复用模板。",
      tags: ["标题", "增长", "模板"],
      tasks: [
        { name: "样本收集", dueDate: "2026-03-25", assigneeId: "member-1", done: false },
        { name: "排版出图", dueDate: "2026-03-27", assigneeId: "member-3", done: false },
      ],
    },
    {
      id: "topic-3",
      title: "老板最关心的内容 ROI 复盘",
      contentType: "短视频",
      series: "运营复盘",
      priority: "高",
      status: "制作中",
      ownerId: "member-4",
      publishDate: "2026-03-24",
      summary: "通过真实投流和自然流案例讲清内容回报。",
      tags: ["ROI", "运营", "复盘"],
      tasks: [
        { name: "补拍口播", dueDate: "2026-03-24", assigneeId: "member-2", done: false },
        { name: "封面上传", dueDate: "2026-03-24", assigneeId: "member-4", done: false },
      ],
    },
    {
      id: "topic-4",
      title: "直播切片矩阵怎么搭",
      contentType: "直播",
      series: "矩阵打法",
      priority: "低",
      status: "已发布",
      ownerId: "member-1",
      publishDate: "2026-03-21",
      summary: "把直播内容拆成预热、直播中、复播三段式切片。",
      tags: ["直播", "矩阵", "案例"],
      tasks: [
        { name: "数据复盘", dueDate: "2026-03-23", assigneeId: "member-4", done: true },
      ],
    },
  ],
};

const statusOrder = ["待排期", "脚本中", "制作中", "已发布"];
const viewTitleMap = {
  dashboard: "总览",
  topics: "选题库",
  calendar: "日历看板",
  team: "团队成员",
};

let state = loadState();
let calendarCursor = new Date();

const els = {
  views: {
    dashboard: document.getElementById("dashboardView"),
    topics: document.getElementById("topicsView"),
    calendar: document.getElementById("calendarView"),
    team: document.getElementById("teamView"),
  },
  navButtons: document.querySelectorAll(".nav-button"),
  pageTitle: document.getElementById("pageTitle"),
  statsGrid: document.getElementById("statsGrid"),
  pipelineBoard: document.getElementById("pipelineBoard"),
  deadlineList: document.getElementById("deadlineList"),
  weeklyFocus: document.getElementById("weeklyFocus"),
  topicForm: document.getElementById("topicForm"),
  topicOwnerSelect: document.getElementById("topicOwnerSelect"),
  topicsTable: document.getElementById("topicsTable"),
  statusFilter: document.getElementById("statusFilter"),
  ownerFilter: document.getElementById("ownerFilter"),
  calendarLabel: document.getElementById("calendarLabel"),
  calendarGrid: document.getElementById("calendarGrid"),
  prevMonth: document.getElementById("prevMonth"),
  nextMonth: document.getElementById("nextMonth"),
  teamGrid: document.getElementById("teamGrid"),
  workloadList: document.getElementById("workloadList"),
  resetDemoData: document.getElementById("resetDemoData"),
  topicCardTemplate: document.getElementById("topicCardTemplate"),
};

initialize();

function initialize() {
  bindEvents();
  els.topicForm.elements.publishDate.value = toDateInputValue(new Date());
  renderAll();
}

function bindEvents() {
  els.navButtons.forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  els.topicForm.addEventListener("submit", handleTopicSubmit);
  els.statusFilter.addEventListener("change", renderTopics);
  els.ownerFilter.addEventListener("change", renderTopics);

  els.prevMonth.addEventListener("click", () => {
    calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
    renderCalendar();
  });

  els.nextMonth.addEventListener("click", () => {
    calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
    renderCalendar();
  });

  els.resetDemoData.addEventListener("click", () => {
    state = structuredClone(DEFAULT_DATA);
    persistState();
    renderAll();
  });
}

function setView(viewName) {
  Object.entries(els.views).forEach(([key, view]) => {
    view.classList.toggle("active", key === viewName);
  });

  els.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  els.pageTitle.textContent = viewTitleMap[viewName];
}

function handleTopicSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const tags = String(formData.get("tags") || "")
    .split(/[，,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  const newTopic = {
    id: `topic-${crypto.randomUUID()}`,
    title: String(formData.get("title") || "").trim(),
    contentType: String(formData.get("contentType") || "短视频"),
    series: String(formData.get("series") || "").trim() || "未分类",
    priority: String(formData.get("priority") || "中"),
    status: "待排期",
    ownerId: String(formData.get("ownerId")),
    publishDate: String(formData.get("publishDate")),
    summary: String(formData.get("summary") || "").trim() || "暂无备注",
    tags,
    tasks: [
      {
        name: "确认选题方向",
        dueDate: String(formData.get("publishDate")),
        assigneeId: String(formData.get("ownerId")),
        done: false,
      },
    ],
  };

  state.topics.unshift(newTopic);
  persistState();
  event.currentTarget.reset();
  renderAll();
  setView("topics");
}

function renderAll() {
  renderFilters();
  renderOwnerOptions();
  renderDashboard();
  renderTopics();
  renderCalendar();
  renderTeam();
}

function renderFilters() {
  const statuses = ["全部状态", ...statusOrder];
  const owners = ["全部负责人", ...state.team.map((member) => member.name)];

  setSelectOptions(els.statusFilter, statuses);
  setSelectOptions(els.ownerFilter, owners);
}

function renderOwnerOptions() {
  els.topicOwnerSelect.innerHTML = state.team
    .map((member) => `<option value="${member.id}">${member.name}｜${member.role}</option>`)
    .join("");
}

function renderDashboard() {
  const publishedThisMonth = state.topics.filter((topic) => {
    const date = parseDateInput(topic.publishDate);
    return (
      date.getFullYear() === calendarCursor.getFullYear() &&
      date.getMonth() === calendarCursor.getMonth() &&
      topic.status === "已发布"
    );
  }).length;

  const stats = [
    {
      label: "选题总数",
      value: state.topics.length,
      note: "持续积累可复用选题资产",
    },
    {
      label: "本周待处理节点",
      value: getUpcomingTasks(7).length,
      note: "未来 7 天需要推进的事项",
    },
    {
      label: "高优先级内容",
      value: state.topics.filter((topic) => topic.priority === "高").length,
      note: "建议优先分配制作资源",
    },
    {
      label: "本月已发布",
      value: publishedThisMonth,
      note: "帮助复盘产能与节奏",
    },
  ];

  els.statsGrid.innerHTML = stats
    .map(
      (stat) => `
        <article class="stat-card">
          <p class="card-label">${stat.label}</p>
          <strong>${stat.value}</strong>
          <span>${stat.note}</span>
        </article>
      `
    )
    .join("");

  els.pipelineBoard.innerHTML = statusOrder
    .map((status) => {
      const topics = state.topics.filter((topic) => topic.status === status);
      return `
        <section class="column-card">
          <h4>${status} <small>(${topics.length})</small></h4>
          ${
            topics.length
              ? topics
                  .map((topic) => {
                    const owner = getMember(topic.ownerId);
                    return `
                      <article class="mini-topic">
                        <strong>${topic.title}</strong>
                        <p>${topic.contentType} · ${owner?.name || "未分配"} · ${formatDate(topic.publishDate)}</p>
                      </article>
                    `;
                  })
                  .join("")
              : `<p class="topic-meta">当前没有内容</p>`
          }
        </section>
      `;
    })
    .join("");

  const upcomingTasks = getUpcomingTasks(7);
  els.deadlineList.innerHTML = upcomingTasks.length
    ? upcomingTasks
        .map(({ task, topic }) => {
          const assignee = getMember(task.assigneeId);
          return `
            <article class="deadline-item">
              <strong>${task.name}</strong>
              <p>${topic.title}</p>
              <p>${formatDate(task.dueDate)} · ${assignee?.name || "未分配"}</p>
            </article>
          `;
        })
        .join("")
    : `<p class="topic-meta">未来七天没有待处理节点。</p>`;

  const weeklyFocus = state.topics
    .filter((topic) => topic.priority === "高" && topic.status !== "已发布")
    .slice(0, 3);

  els.weeklyFocus.innerHTML = weeklyFocus
    .map((topic) => {
      const owner = getMember(topic.ownerId);
      return `
        <article class="weekly-item">
          <strong>${topic.title}</strong>
          <span>${topic.status} · ${owner?.name || "未分配"}</span>
        </article>
      `;
    })
    .join("");
}

function renderTopics() {
  const selectedStatus = els.statusFilter.value;
  const selectedOwner = els.ownerFilter.value;

  const filtered = state.topics.filter((topic) => {
    const owner = getMember(topic.ownerId);
    const statusMatch = selectedStatus === "全部状态" || topic.status === selectedStatus;
    const ownerMatch = selectedOwner === "全部负责人" || owner?.name === selectedOwner;
    return statusMatch && ownerMatch;
  });

  els.topicsTable.innerHTML = filtered.length
    ? filtered.map((topic) => renderTopicCard(topic)).join("")
    : `<p class="topic-meta">没有符合筛选条件的选题。</p>`;

  els.topicsTable.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", handleTopicAction);
  });
}

function renderTopicCard(topic) {
  const owner = getMember(topic.ownerId);
  const nextStatus = getNextStatus(topic.status);
  const priorityClass = {
    高: "priority-high",
    中: "priority-medium",
    低: "priority-low",
  }[topic.priority];

  return `
    <article class="topic-card">
      <div class="topic-card-top">
        <div>
          <h4 class="topic-title">${topic.title}</h4>
          <p class="topic-meta">${topic.contentType} · ${topic.series} · ${owner?.name || "未分配"} · ${formatDate(topic.publishDate)}</p>
        </div>
        <span class="priority-badge ${priorityClass}">${topic.priority}优先级</span>
      </div>
      <p class="topic-summary">${topic.summary}</p>
      <div class="tag-row">${topic.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
      <div class="topic-footer">
        <span class="status-pill">${topic.status}</span>
        <div class="topic-actions">
          ${
            nextStatus
              ? `<button class="action-button" data-action="advance" data-id="${topic.id}">推进到${nextStatus}</button>`
              : ""
          }
          <button class="action-button" data-action="task" data-id="${topic.id}">补一个任务</button>
        </div>
      </div>
    </article>
  `;
}

function handleTopicAction(event) {
  const action = event.currentTarget.dataset.action;
  const topicId = event.currentTarget.dataset.id;
  const topic = state.topics.find((item) => item.id === topicId);
  if (!topic) return;

  if (action === "advance") {
    const nextStatus = getNextStatus(topic.status);
    if (nextStatus) {
      topic.status = nextStatus;
    }
  }

  if (action === "task") {
    const dueDate = topic.publishDate;
    topic.tasks.push({
      name: `新增协作节点 ${topic.tasks.length + 1}`,
      dueDate,
      assigneeId: topic.ownerId,
      done: false,
    });
  }

  persistState();
  renderAll();
}

function renderCalendar() {
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  els.calendarLabel.textContent = `${year} 年 ${month + 1} 月`;

  const cells = [];
  const weekLabels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  weekLabels.forEach((label) => {
    cells.push(`<div class="calendar-cell"><div class="calendar-day"><strong>${label}</strong></div></div>`);
  });

  for (let i = 0; i < 42; i += 1) {
    const dayNumber = i - startWeekday + 1;
    const inCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
    const displayDay = inCurrentMonth
      ? dayNumber
      : dayNumber <= 0
        ? prevMonthDays + dayNumber
        : dayNumber - daysInMonth;

    const date = new Date(year, month, dayNumber);
    const dateKey = toDateInputValue(date);
    const topics = state.topics.filter((topic) => topic.publishDate === dateKey);

    cells.push(`
      <article class="calendar-cell ${inCurrentMonth ? "" : "muted"}">
        <div class="calendar-day">
          <span>${displayDay}</span>
          <small>${topics.length ? `${topics.length} 条` : ""}</small>
        </div>
        ${topics
          .map((topic) => {
            const owner = getMember(topic.ownerId);
            return `
              <div class="calendar-item">
                <strong>${topic.title}</strong>
                <p>${topic.status} · ${owner?.name || "未分配"}</p>
              </div>
            `;
          })
          .join("")}
      </article>
    `);
  }

  els.calendarGrid.innerHTML = cells.join("");
}

function renderTeam() {
  els.teamGrid.innerHTML = state.team
    .map((member) => {
      const ownedTopics = state.topics.filter((topic) => topic.ownerId === member.id);
      const openTasks = state.topics.flatMap((topic) =>
        topic.tasks
          .filter((task) => task.assigneeId === member.id && !task.done)
          .map((task) => ({ task, topic }))
      );

      return `
        <article class="member-card">
          <h4>${member.name}</h4>
          <p class="member-meta">${member.role}</p>
          <p class="member-meta">${member.focus}</p>
          <div class="member-stats">
            <span class="metric">负责选题 ${ownedTopics.length}</span>
            <span class="metric">待办节点 ${openTasks.length}</span>
            <span class="metric">建议容量 ${member.capacity}/周</span>
          </div>
        </article>
      `;
    })
    .join("");

  els.workloadList.innerHTML = state.team
    .map((member) => {
      const openTasks = getUpcomingTasks(30).filter(({ task }) => task.assigneeId === member.id);
      return `
        <article class="workload-item">
          <strong>${member.name}</strong>
          <p>${member.role}</p>
          <p>${openTasks.length ? openTasks.map(({ task }) => `${formatDate(task.dueDate)} ${task.name}`).join(" / ") : "当前 30 天内无待办节点"}</p>
        </article>
      `;
    })
    .join("");
}

function getUpcomingTasks(days) {
  const now = new Date();
  const end = new Date();
  end.setDate(end.getDate() + days);

  return state.topics
    .flatMap((topic) =>
      topic.tasks.map((task) => ({
        task,
        topic,
      }))
    )
    .filter(({ task }) => {
      if (task.done) return false;
      const dueDate = parseDateInput(task.dueDate);
      return dueDate >= stripTime(now) && dueDate <= stripTime(end);
    })
    .sort((a, b) => parseDateInput(a.task.dueDate) - parseDateInput(b.task.dueDate));
}

function getMember(memberId) {
  return state.team.find((member) => member.id === memberId);
}

function getNextStatus(status) {
  const index = statusOrder.indexOf(status);
  if (index === -1 || index === statusOrder.length - 1) return null;
  return statusOrder[index + 1];
}

function setSelectOptions(select, values) {
  const currentValue = select.value;
  select.innerHTML = values.map((value) => `<option value="${value}">${value}</option>`).join("");
  if (values.includes(currentValue)) {
    select.value = currentValue;
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(DEFAULT_DATA);

  try {
    return JSON.parse(saved);
  } catch (error) {
    console.error("Failed to parse saved state", error);
    return structuredClone(DEFAULT_DATA);
  }
}

function formatDate(dateString) {
  return parseDateInput(dateString).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
}

function parseDateInput(dateString) {
  const [year, month, day] = String(dateString).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
