// 투두리스트 애플리케이션
class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        this.editingId = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderTodoList();
        this.renderCalendar();
        this.setDefaultDate();
    }

    setupEventListeners() {
        // 폼 제출 이벤트
        document.getElementById('todoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTodo();
        });

        // 탭 전환 이벤트
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // 달력 네비게이션
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.changeMonth(-1);
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.changeMonth(1);
        });
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('todoDate').value = today;
    }

    addTodo() {
        const textInput = document.getElementById('todoInput');
        const dateInput = document.getElementById('todoDate');
        
        const text = textInput.value.trim();
        const date = dateInput.value;

        if (!text || !date) return;

        if (this.editingId !== null) {
            // 수정 모드
            this.updateTodo(this.editingId, text, date);
            this.editingId = null;
        } else {
            // 새 할일 추가
            const todo = {
                id: Date.now(),
                text: text,
                date: date,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            this.todos.push(todo);
        }

        this.saveTodos();
        this.renderTodoList();
        this.renderCalendar();
        
        textInput.value = '';
        textInput.focus();
    }

    updateTodo(id, text, date) {
        const todoIndex = this.todos.findIndex(todo => todo.id === id);
        if (todoIndex !== -1) {
            this.todos[todoIndex].text = text;
            this.todos[todoIndex].date = date;
        }
    }

    deleteTodo(id) {
        if (confirm('정말로 이 할일을 삭제하시겠습니까?')) {
            this.todos = this.todos.filter(todo => todo.id !== id);
            this.saveTodos();
            this.renderTodoList();
            this.renderCalendar();
        }
    }

    toggleComplete(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.renderTodoList();
            this.renderCalendar();
        }
    }

    editTodo(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            this.editingId = id;
            document.getElementById('todoInput').value = todo.text;
            document.getElementById('todoDate').value = todo.date;
            document.getElementById('todoInput').focus();
        }
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    renderTodoList() {
        const todoList = document.getElementById('todoList');
        todoList.innerHTML = '';

        if (this.todos.length === 0) {
            todoList.innerHTML = '<div class="empty-state">할일이 없습니다. 새로운 할일을 추가해보세요!</div>';
            return;
        }

        // 날짜별로 정렬
        const sortedTodos = [...this.todos].sort((a, b) => {
            if (a.date === b.date) {
                return new Date(a.createdAt) - new Date(b.createdAt);
            }
            return a.date.localeCompare(b.date);
        });

        sortedTodos.forEach(todo => {
            const todoItem = this.createTodoElement(todo);
            todoList.appendChild(todoItem);
        });
    }

    createTodoElement(todo) {
        const todoItem = document.createElement('div');
        todoItem.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        todoItem.dataset.id = todo.id;

        const formattedDate = this.formatDate(todo.date);
        
        todoItem.innerHTML = `
            <div class="todo-header">
                <div class="todo-text">${todo.text}</div>
                <div class="todo-date">${formattedDate}</div>
                <div class="todo-actions">
                    <button class="complete-btn" onclick="todoApp.toggleComplete(${todo.id})">
                        ${todo.completed ? '되돌리기' : '완료'}
                    </button>
                    <button class="edit-btn" onclick="todoApp.editTodo(${todo.id})">수정</button>
                    <button class="delete-btn" onclick="todoApp.deleteTodo(${todo.id})">삭제</button>
                </div>
            </div>
        `;

        return todoItem;
    }

    formatDate(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayString = this.formatDateForStorage(today);
        const tomorrowString = this.formatDateForStorage(tomorrow);
        const dateStringFormatted = this.formatDateForStorage(date);

        if (dateStringFormatted === todayString) {
            return '오늘';
        } else if (dateStringFormatted === tomorrowString) {
            return '내일';
        } else {
            return date.toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
                weekday: 'short'
            });
        }
    }

    switchView(view) {
        // 탭 버튼 상태 변경
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // 뷰 컨텐츠 변경
        document.querySelectorAll('.view-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${view}View`).classList.add('active');

        // 달력 뷰로 전환시 달력 다시 렌더링
        if (view === 'calendar') {
            this.renderCalendar();
        }
    }

    changeMonth(delta) {
        this.currentMonth += delta;
        
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        } else if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        
        this.renderCalendar();
    }

    renderCalendar() {
        const calendarDays = document.getElementById('calendarDays');
        const currentMonthElement = document.getElementById('currentMonth');
        
        // 현재 월 표시
        const monthNames = [
            '1월', '2월', '3월', '4월', '5월', '6월',
            '7월', '8월', '9월', '10월', '11월', '12월'
        ];
        currentMonthElement.textContent = `${this.currentYear}년 ${monthNames[this.currentMonth]}`;

        // 달력 날짜 생성
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        calendarDays.innerHTML = '';

        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);

            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            const isCurrentMonth = currentDate.getMonth() === this.currentMonth;
            const isToday = this.isToday(currentDate);
            
            if (!isCurrentMonth) {
                dayElement.classList.add('other-month');
            }
            
            if (isToday) {
                dayElement.classList.add('today');
            }

            const dayNumber = currentDate.getDate();
            const dateString = this.formatDateForStorage(currentDate);
            const dayTodos = this.getTodosForDate(dateString);

            dayElement.innerHTML = `
                <div class="day-number">${dayNumber}</div>
                <div class="day-todos">
                    ${dayTodos.map(todo => `
                        <div class="day-todo-item ${todo.completed ? 'completed' : ''}" title="${todo.text}">
                            ${todo.text}
                        </div>
                    `).join('')}
                </div>
            `;

            calendarDays.appendChild(dayElement);
        }
    }

    isToday(date) {
        const today = new Date();
        const todayString = this.formatDateForStorage(today);
        const dateString = this.formatDateForStorage(date);
        return dateString === todayString;
    }

    getTodosForDate(dateString) {
        return this.todos.filter(todo => todo.date === dateString);
    }

    formatDateForStorage(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

// 애플리케이션 초기화
const todoApp = new TodoApp();

// 빈 상태 스타일 추가
const style = document.createElement('style');
style.textContent = `
    .empty-state {
        text-align: center;
        padding: 40px;
        color: #666;
        font-size: 1.1rem;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 15px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        backdrop-filter: blur(10px);
    }
    
    .day-todo-item.completed {
        text-decoration: line-through;
        opacity: 0.6;
    }
`;
document.head.appendChild(style); 