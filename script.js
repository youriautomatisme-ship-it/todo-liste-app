// État de l'application
let appData = {
    lists: [],
    completedTasks: [],
    theme: 'light',
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear()
};

let deleteListId = null;
let currentChartPeriod = 'week';

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    applyTheme();
    renderCalendar();
    renderLists();
    renderChart();
    
    // Listener pour Enter dans le champ
    document.getElementById('newListName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            createNewList();
        }
    });
});

// Gestion du thème
function toggleTheme() {
    appData.theme = appData.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    saveData();
}

function applyTheme() {
    document.body.setAttribute('data-theme', appData.theme);
}

// Gestion des données
function saveData() {
    try {
        localStorage.setItem('todoAppData', JSON.stringify(appData));
        console.log('Données sauvegardées avec succès');
    } catch (e) {
        console.error('Erreur lors de la sauvegarde:', e);
    }
}

function loadData() {
    try {
        const saved = localStorage.getItem('todoAppData');
        if (saved) {
            const loaded = JSON.parse(saved);
            appData = {
                ...appData,
                ...loaded,
                currentMonth: appData.currentMonth,
                currentYear: appData.currentYear
            };
            console.log('Données chargées:', appData);
        }
    } catch (e) {
        console.error('Erreur lors du chargement:', e);
    }
}

// Calendrier
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    const titleElement = document.getElementById('calendarTitle');
    calendar.innerHTML = '';
    
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    titleElement.textContent = `${monthNames[appData.currentMonth]} ${appData.currentYear}`;
    
    const firstDay = new Date(appData.currentYear, appData.currentMonth, 1).getDay();
    const daysInMonth = new Date(appData.currentYear, appData.currentMonth + 1, 0).getDate();
    
    const today = new Date();
    const isCurrentMonth = today.getMonth() === appData.currentMonth && 
                           today.getFullYear() === appData.currentYear;
    
    // Jours de la semaine
    ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach(day => {
        const dayLabel = document.createElement('div');
        dayLabel.className = 'calendar-day-header';
        dayLabel.textContent = day;
        calendar.appendChild(dayLabel);
    });
    
    // Espaces vides avant le premier jour
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < adjustedFirstDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'calendar-day empty';
        calendar.appendChild(emptyDiv);
    }
    
    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.textContent = day;
        
        if (isCurrentMonth && day === today.getDate()) {
            dayDiv.classList.add('today');
        }
        
        calendar.appendChild(dayDiv);
    }
}

function changeMonth(direction) {
    appData.currentMonth += direction;
    
    if (appData.currentMonth > 11) {
        appData.currentMonth = 0;
        appData.currentYear++;
    } else if (appData.currentMonth < 0) {
        appData.currentMonth = 11;
        appData.currentYear--;
    }
    
    renderCalendar();
}

// Graphique
function renderChart() {
    const canvas = document.getElementById('taskChart');
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.offsetWidth;
    canvas.height = 250;
    
    const data = getChartData(currentChartPeriod);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const barWidth = chartWidth / data.length;
    const maxValue = Math.max(...data.map(d => d.count), 1);
    
    const isDark = appData.theme === 'dark';
    const barColor = isDark ? '#cccccc' : '#333333';
    const textColor = isDark ? '#ffffff' : '#000000';
    const gridColor = isDark ? '#444444' : '#cccccc';
    
    ctx.fillStyle = textColor;
    ctx.strokeStyle = gridColor;
    ctx.font = '12px Segoe UI';
    
    data.forEach((item, index) => {
        const barHeight = (item.count / maxValue) * chartHeight;
        const x = padding + index * barWidth;
        const y = padding + chartHeight - barHeight;
        
        ctx.fillStyle = barColor;
        ctx.fillRect(x + 5, y, barWidth - 10, barHeight);
        
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.fillText(item.label, x + barWidth / 2, canvas.height - 10);
        if (item.count > 0) {
            ctx.fillText(item.count, x + barWidth / 2, y - 5);
        }
    });
    
    ctx.strokeStyle = gridColor;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
}

function getChartData(period) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let days = 7;
    if (period === 'month') days = 30;
    if (period === 'quarter') days = 90;
    
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const count = appData.completedTasks.filter(t => t.date === dateStr).length;
        
        let label = '';
        if (period === 'week') {
            label = date.getDate().toString();
        } else if (period === 'month') {
            if (i % 5 === 0 || i === 0) label = date.getDate().toString();
        } else {
            if (i % 15 === 0 || i === 0) label = (date.getMonth() + 1) + '/' + date.getDate();
        }
        
        data.push({ label, count, date: dateStr });
    }
    
    return data;
}

function changeChartPeriod(period) {
    currentChartPeriod = period;
    
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderChart();
}

// Gestion des listes
function openNewListModal() {
    const modal = document.getElementById('newListModal');
    const input = document.getElementById('newListName');
    modal.classList.add('active');
    input.value = '';
    setTimeout(() => input.focus(), 100);
}

function closeNewListModal() {
    document.getElementById('newListModal').classList.remove('active');
}

function createNewList() {
    const nameInput = document.getElementById('newListName');
    const name = nameInput.value.trim();
    
    if (name) {
        const newList = {
            id: Date.now(),
            name: name,
            tasks: []
        };
        
        appData.lists.push(newList);
        saveData();
        renderLists();
        closeNewListModal();
    } else {
        alert('Veuillez entrer un nom pour la liste');
    }
}

function renderLists() {
    const container = document.getElementById('listsContainer');
    container.innerHTML = '';
    
    appData.lists.forEach(list => {
        const listCard = createListCard(list);
        container.appendChild(listCard);
    });
}

function createListCard(list) {
    const card = document.createElement('div');
    card.className = 'list-card';
    
    const header = document.createElement('div');
    header.className = 'list-header';
    
    const title = document.createElement('div');
    title.className = 'list-title';
    title.textContent = list.name;
    
    const actions = document.createElement('div');
    actions.className = 'list-actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn';
    editBtn.innerHTML = '✏️';
    editBtn.onclick = () => editListName(list.id);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn';
    deleteBtn.innerHTML = '❌';
    deleteBtn.onclick = () => openDeleteModal(list.id);
    
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    
    header.appendChild(title);
    header.appendChild(actions);
    card.appendChild(header);
    
    if (list.tasks && list.tasks.length > 0) {
        list.tasks.forEach(task => {
            const taskItem = createTaskItem(list.id, task);
            card.appendChild(taskItem);
        });
    }
    
    const addBtn = document.createElement('button');
    addBtn.className = 'add-task-btn';
    addBtn.textContent = '+ Ajouter une tâche';
    addBtn.onclick = () => addTask(list.id);
    card.appendChild(addBtn);
    
    return card;
}

function createTaskItem(listId, task) {
    const item = document.createElement('div');
    item.className = 'task-item';
    if (task.completed) item.classList.add('completed');
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.onchange = () => toggleTask(listId, task.id);
    
    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;
    
    const actions = document.createElement('div');
    actions.className = 'task-actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn';
    editBtn.innerHTML = '✏️';
    editBtn.onclick = () => editTask(listId, task.id);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn';
    deleteBtn.innerHTML = '❌';
    deleteBtn.onclick = () => deleteTask(listId, task.id);
    
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    
    item.appendChild(checkbox);
    item.appendChild(text);
    item.appendChild(actions);
    
    return item;
}

function addTask(listId) {
    const taskText = prompt('Entrez le nom de la tâche :');
    
    if (taskText && taskText.trim()) {
        const list = appData.lists.find(l => l.id === listId);
        
        if (list) {
            if (!list.tasks) list.tasks = [];
            
            const newTask = {
                id: Date.now(),
                text: taskText.trim(),
                completed: false
            };
            
            list.tasks.push(newTask);
            saveData();
            renderLists();
        }
    } else if (taskText !== null) {
        alert('Veuillez entrer un nom pour la tâche');
    }
}

function toggleTask(listId, taskId) {
    const list = appData.lists.find(l => l.id === listId);
    if (list) {
        const task = list.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            
            if (task.completed) {
                const today = new Date().toISOString().split('T')[0];
                appData.completedTasks.push({
                    date: today,
                    taskId: taskId,
                    listId: listId
                });
            } else {
                appData.completedTasks = appData.completedTasks.filter(
                    ct => !(ct.taskId === taskId && ct.listId === listId)
                );
            }
            
            saveData();
            renderLists();
            renderChart();
        }
    }
}

function editTask(listId, taskId) {
    const list = appData.lists.find(l => l.id === listId);
    if (list) {
        const task = list.tasks.find(t => t.id === taskId);
        if (task) {
            const newText = prompt('Modifier la tâche :', task.text);
            if (newText && newText.trim()) {
                task.text = newText.trim();
                saveData();
                renderLists();
            }
        }
    }
}

function deleteTask(listId, taskId) {
    const list = appData.lists.find(l => l.id === listId);
    if (list) {
        list.tasks = list.tasks.filter(t => t.id !== taskId);
        appData.completedTasks = appData.completedTasks.filter(
            ct => !(ct.taskId === taskId && ct.listId === listId)
        );
        saveData();
        renderLists();
        renderChart();
    }
}

function editListName(listId) {
    const list = appData.lists.find(l => l.id === listId);
    if (list) {
        const newName = prompt('Modifier le nom de la liste :', list.name);
        if (newName && newName.trim()) {
            list.name = newName.trim();
            saveData();
            renderLists();
        }
    }
}

function openDeleteModal(listId) {
    deleteListId = listId;
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    deleteListId = null;
    document.getElementById('deleteModal').classList.remove('active');
}

function confirmDelete() {
    if (deleteListId) {
        appData.lists = appData.lists.filter(l => l.id !== deleteListId);
        appData.completedTasks = appData.completedTasks.filter(
            ct => ct.listId !== deleteListId
        );
        saveData();
        renderLists();
        renderChart();
        closeDeleteModal();
    }
}

// Navigation mentions légales
function showLegalPage() {
    document.getElementById('mainPage').style.display = 'none';
    document.getElementById('legalPage').style.display = 'block';
    window.scrollTo(0, 0);
}

function showMainPage() {
    document.getElementById('mainPage').style.display = 'block';
    document.getElementById('legalPage').style.display = 'none';
    window.scrollTo(0, 0);
}

// Redessiner le graphique lors du redimensionnement
window.addEventListener('resize', renderChart);

// ==================== GESTION EXPORT/IMPORT ====================

// Exporter les données vers un fichier JSON
function exportData() {
    try {
        // Créer un objet avec toutes les données
        const dataToExport = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            data: appData
        };
        
        // Convertir en JSON
        const jsonString = JSON.stringify(dataToExport, null, 2);
        
        // Créer un blob (fichier temporaire)
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        // Créer un lien de téléchargement
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `todo-data-${new Date().toISOString().split('T')[0]}.json`;
        
        // Déclencher le téléchargement
        document.body.appendChild(a);
        a.click();
        
        // Nettoyer
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('✅ Données exportées avec succès !');
    } catch (e) {
        console.error('Erreur lors de l\'export:', e);
        alert('❌ Erreur lors de l\'export des données');
    }
}

// Importer les données depuis un fichier JSON
function importData() {
    // Déclencher le sélecteur de fichier
    document.getElementById('fileInput').click();
}

// Gérer le fichier sélectionné
function handleFileSelect(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }
    
    if (file.type !== 'application/json') {
        alert('❌ Veuillez sélectionner un fichier JSON');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            // Lire et parser le JSON
            const importedData = JSON.parse(e.target.result);
            
            // Vérifier que les données sont valides
            if (!importedData.data || !importedData.data.lists) {
                throw new Error('Format de données invalide');
            }
            
            // Demander confirmation
            const confirm = window.confirm(
                '⚠️ Attention !\n\n' +
                'L\'importation va REMPLACER toutes vos données actuelles.\n\n' +
                'Voulez-vous continuer ?'
            );
            
            if (!confirm) {
                return;
            }
            
            // Remplacer les données
            appData = {
                ...appData,
                ...importedData.data
            };
            
            // Sauvegarder dans localStorage
            saveData();
            
            // Rafraîchir l'affichage
            applyTheme();
            renderCalendar();
            renderLists();
            renderChart();
            
            alert('✅ Données importées avec succès !');
            
        } catch (e) {
            console.error('Erreur lors de l\'import:', e);
            alert('❌ Erreur lors de l\'import des données\n\nVérifiez que le fichier est valide.');
        }
    };
    
    reader.readAsText(file);
    
    // Réinitialiser l'input pour permettre de recharger le même fichier
    event.target.value = '';
}

// Réinitialiser toutes les données
function resetData() {
    const confirm = window.confirm(
        '⚠️ ATTENTION !\n\n' +
        'Voulez-vous vraiment SUPPRIMER TOUTES vos données ?\n\n' +
        'Cette action est IRRÉVERSIBLE !\n\n' +
        'Pensez à exporter vos données avant si vous voulez les sauvegarder.'
    );
    
    if (!confirm) {
        return;
    }
    
    const doubleConfirm = window.confirm(
        '⚠️ DERNIÈRE CONFIRMATION\n\n' +
        'Êtes-vous ABSOLUMENT SÛR de vouloir tout supprimer ?'
    );
    
    if (!doubleConfirm) {
        return;
    }
    
    // Réinitialiser les données
    appData = {
        lists: [],
        completedTasks: [],
        theme: 'light',
        currentMonth: new Date().getMonth(),
        currentYear: new Date().getFullYear()
    };
    
    // Sauvegarder
    saveData();
    
    // Rafraîchir l'affichage
    applyTheme();
    renderCalendar();
    renderLists();
    renderChart();
    
    alert('✅ Toutes les données ont été supprimées');
}

// Ajouter l'événement sur l'input file au chargement
document.addEventListener('DOMContentLoaded', function() {
    // ... votre code existant ...
    
    // Ajouter l'événement pour l'import de fichier
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
});
