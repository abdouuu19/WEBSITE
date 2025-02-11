let modules = [];
let gradingSystem = { tdWeight: 40, examWeight: 60 };

// Show notification
function showNotification(message) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    notificationText.textContent = message;
    notification.classList.remove('hidden');
    setTimeout(() => notification.classList.add('hidden'), 3000);
}

// Set grading system
function setGradingSystem(td, exam) {
    gradingSystem = { tdWeight: td, examWeight: exam };
    showNotification(`Grading system updated to ${td}% TD - ${exam}% Exam`);
}

// Add module
function addModule() {
    const moduleId = modules.length + 1;
    const moduleDiv = document.createElement('div');
    moduleDiv.classList.add('module-row');
    moduleDiv.innerHTML = `
        <input type="text" class="module-name" placeholder="Module Name" required>
        <input type="number" id="td${moduleId}" min="0" max="20" step="0.1" placeholder="TD (/20)" required>
        <input type="number" id="exam${moduleId}" min="0" max="20" step="0.1" placeholder="Exam (/20)">
        <input type="number" id="coef${moduleId}" min="1" max="10" placeholder="Coefficient" value="1" required>
        <div class="switch td-only-switch">
            <label>
                <input type="checkbox" id="tdOnly${moduleId}" onchange="toggleTDOnly(${moduleId})">
                <span class="lever"></span>
                TD Only
            </label>
        </div>
        <span id="result${moduleId}" class="result-display">--/20</span>
    `;
    document.getElementById('modules').appendChild(moduleDiv);
    modules.push(moduleId);
}

// Toggle TD Only mode
function toggleTDOnly(moduleId) {
    const examField = document.getElementById(`exam${moduleId}`);
    const checkbox = document.getElementById(`tdOnly${moduleId}`);
    examField.disabled = checkbox.checked;
    if (checkbox.checked) {
        examField.value = '';
        showNotification('TD Only mode enabled - Exam grade will not be considered');
    } else {
        showNotification('TD Only mode disabled - Please enter exam grade');
    }
}

// Calculate grades
function calculateFinalGrade() {
    let totalWeighted = 0;
    let totalCoefficient = 0;
    let validInput = true;

    modules.forEach(moduleId => {
        const moduleNameElement = document.querySelector(`#modules div:nth-child(${moduleId}) .module-name`);
        const td = parseFloat(document.getElementById(`td${moduleId}`).value);
        const exam = parseFloat(document.getElementById(`exam${moduleId}`).value);
        const coef = parseFloat(document.getElementById(`coef${moduleId}`).value) || 1;
        const tdOnly = document.getElementById(`tdOnly${moduleId}`).checked;

        if (!moduleNameElement.value || isNaN(td) || (!tdOnly && isNaN(exam))) {
            validInput = false;
            showNotification('Please fill in all required fields');
            return;
        }

        const grade = tdOnly
            ? td
            : (td * gradingSystem.tdWeight / 100) + (exam * gradingSystem.examWeight / 100);

        const resultElement = document.getElementById(`result${moduleId}`);
        resultElement.textContent = `${grade.toFixed(2)}/20`;
        resultElement.className = `result-display ${grade >= 10 ? 'green-text' : 'red-text'}`;

        totalWeighted += grade * coef;
        totalCoefficient += coef;
    });

    if (!validInput) return;

    const finalGrade = totalWeighted / totalCoefficient;
    updateResults(finalGrade);
}

// Update results display
function updateResults(finalGrade) {
    const finalResult = document.getElementById('final-result');
    const finalQuote = document.getElementById('final-quote');
    const progressBar = document.getElementById('progress-bar');

    finalResult.textContent = `Final Grade: ${finalGrade.toFixed(2)}/20`;
    progressBar.style.width = `${Math.min(finalGrade * 5, 100)}%`;

    // Set quote based on grade
    if (finalGrade >= 16) {
        finalQuote.textContent = "Outstanding achievement! You're excelling in your studies! 🌟";
    } else if (finalGrade >= 14) {
        finalQuote.textContent = "Excellent work! Keep up the great performance! 🎉";
    } else if (finalGrade >= 12) {
        finalQuote.textContent = "Good job! You're on the right track! 👍";
    } else if (finalGrade >= 10) {
        finalQuote.textContent = "You've passed! Keep working to improve further! 💪";
    } else {
        finalQuote.textContent = "Don't give up! With more effort, you can improve! 📚";
    }
}

// Generate PDF
function generatePDF() {
    if (modules.length === 0) {
        showNotification('Please add at least one module first');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Set up document
    doc.setFontSize(20);
    doc.setTextColor(33, 150, 243); // Blue header
    doc.text('Grade Calculator Results', 105, 20, { align: 'center' });
    
    // Add current date
    doc.setFontSize(10);
    doc.setTextColor(100);
    const date = new Date().toLocaleDateString();
    doc.text(`Generated on: ${date}`, 105, 30, { align: 'center' });

    // Table header
    doc.setFontSize(12);
    doc.setTextColor(0);
    const headers = ['Module Name', 'TD', 'Exam', 'Coefficient', 'Final Grade'];
    let startY = 45;
    const cellWidth = 38;
    
    // Draw header background
    doc.setFillColor(33, 150, 243);
    doc.rect(10, startY - 5, 190, 10, 'F');
    
    // Draw header text
    doc.setTextColor(255);
    headers.forEach((header, i) => {
        doc.text(header, 15 + (i * cellWidth), startY);
    });

    // Table content
    doc.setTextColor(0);
    startY += 10;
    
    modules.forEach((moduleId, index) => {
        const moduleElement = document.querySelector(`#modules div:nth-child(${moduleId}) .module-name`);
        const moduleName = moduleElement.value;
        const td = document.getElementById(`td${moduleId}`).value || '--';
        const exam = document.getElementById(`exam${moduleId}`).value || '--';
        const coef = document.getElementById(`coef${moduleId}`).value || '1';
        const result = document.getElementById(`result${moduleId}`).textContent;

        // Alternate row background
        if (index % 2 === 0) {
            doc.setFillColor(240, 240, 240);
            doc.rect(10, startY - 5, 190, 10, 'F');
        }

        doc.text(moduleName, 15, startY);
        doc.text(td.toString(), 15 + cellWidth, startY);
        doc.text(exam.toString(), 15 + (cellWidth * 2), startY);
        doc.text(coef.toString(), 15 + (cellWidth * 3), startY);
        doc.text(result, 15 + (cellWidth * 4), startY);

        startY += 10;
    });

    // Final grade
    const finalGrade = document.getElementById('final-result').textContent;
    const finalQuote = document.getElementById('final-quote').textContent;
    
    startY += 10;
    doc.setFillColor(33, 150, 243, 0.1);
    doc.rect(10, startY - 5, 190, 20, 'F');
    
    doc.setFontSize(14);
    doc.setTextColor(33, 150, 243);
    doc.text(finalGrade, 105, startY + 5, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(finalQuote, 105, startY + 15, { align: 'center' });

    // Save PDF
    doc.save('GradeCalculatorResults.pdf');
    showNotification('PDF generated successfully!');
}

// Initialize first module on page load
document.addEventListener('DOMContentLoaded', () => {
    addModule();
});