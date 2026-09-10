/**
 * SGHMS — Smart Government Healthcare Management System
 * Application Logic (Multi-Page)
 */

// ---- Booking Flow (Wizard on book-appointment.html) ----
let currentBookingStep = 1;

function goToStep(step) {
  // Hide all steps
  document.querySelectorAll('.booking-step').forEach(el => {
    el.classList.remove('active');
  });

  // Show target step
  const targetStep = document.getElementById('step-' + step);
  if (targetStep) {
    targetStep.classList.add('active');
  }

  // Update Progress Bar
  for (let i = 1; i <= 5; i++) {
    const ps = document.getElementById('ps' + i);
    const pl = document.getElementById('pl' + i);

    if (ps) {
      ps.classList.remove('active', 'done');
      if (i < step) {
        ps.classList.add('done');
        ps.innerHTML = '✓';
      } else if (i === step) {
        ps.classList.add('active');
        ps.innerHTML = i;
      } else {
        ps.innerHTML = i;
      }
    }

    if (pl) {
      pl.classList.remove('active', 'done');
      if (i < step) {
        pl.classList.add('done');
      } else if (i === step) {
        pl.classList.add('active');
      }
    }
  }

  // Update Top Bar Title
  const titles = [
    'Select Department (1/5)',
    'Choose Doctor (2/5)',
    'Choose Date & Time (3/5)',
    'Book Appointment (4/5)',
    'Appointment Confirmed!'
  ];
  const stepTitle = document.getElementById('step-title');
  if (stepTitle && step <= 5) {
    stepTitle.textContent = titles[step - 1];
  }

  // Handle Back Button inside the wizard
  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    if (step === 1) {
      backBtn.setAttribute('href', 'dashboard.html');
      backBtn.onclick = null;
    } else if (step === 5) {
      localStorage.setItem('appointmentBooked', 'true');
      localStorage.setItem('bookedAppointmentData', JSON.stringify(bookingData));
      backBtn.setAttribute('href', 'dashboard.html');
      backBtn.onclick = null;
    } else {
      backBtn.removeAttribute('href');
      backBtn.onclick = (e) => {
        e.preventDefault();
        goToStep(step - 1);
      };
    }
  }

  currentBookingStep = step;
  window.scrollTo(0, 0);
}

// ---- Symptom Checker Logic ----
const GEMINI_API_KEY = "AQ.Ab8RN6LtG8nbcu7gFU_-J61ODD3ID3kSaohePGoNq3VZ3uSPqg";

const deptEmojis = {
  'General Medicine': '<div class="dept-icon" style="background:#e0e7ff;color:#4f46e5;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>',
  'Cardiology': '<div class="dept-icon" style="background:#ffe4e6;color:#e11d48;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></div>',
  'Orthopedics': '<div class="dept-icon" style="background:#f3f4f6;color:#4b5563;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2L2 14M22 10L10 22M15 9l-6-6a3 3 0 00-4 4l6 6M9 15l6 6a3 3 0 004-4l-6-6"/></svg></div>',
  'Pediatrics': '<div class="dept-icon" style="background:#fef3c7;color:#d97706;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="5"/><path d="M3 21v-2a7 7 0 0114 0v2M19 10a3 3 0 013 3M2 13a3 3 0 013-3"/></svg></div>',
  'Gynecology': '<div class="dept-icon" style="background:#fce7f3;color:#db2777;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="10" r="6"/><path d="M12 16v6M9 19h6"/></svg></div>',
  'Neurology': '<div class="dept-icon" style="background:#f4f4f5;color:#52525b;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 4c4.41 0 8 3.59 8 8 0 1.25-.29 2.43-.8 3.48l-2.03-3.04-1.39 1.39L17.7 17.5A7.915 7.915 0 0112 20c-4.41 0-8-3.59-8-8 0-4.41 3.59-8 8-8z"/><path d="M12 7c-2.76 0-5 2.24-5 5h2c0-1.66 1.34-3 3-3V7z"/></svg></div>',
  'ENT': '<div class="dept-icon" style="background:#fff7ed;color:#ea580c;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 20a4 4 0 008-8V8a5 5 0 00-10 0v2H6a2 2 0 000 4h3v6z"/></svg></div>',
  'Ophthalmology': '<div class="dept-icon" style="background:#e0f2fe;color:#0284c7;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div>',
  'Dermatology': '<div class="dept-icon" style="background:#fce7f3;color:#be185d;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM8 18h8v-2H8v2zm0-4h8v-2H8v2zm0-4h8V8H8v2z"/></svg></div>',
  'Psychiatry': '<div class="dept-icon" style="background:#faf5ff;color:#9333ea;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg></div>'
};

let activeSymptoms = new Set();

function toggleSymptom(el) {
  const symptom = el.innerText.trim();
  if (activeSymptoms.has(symptom)) {
    activeSymptoms.delete(symptom);
    el.classList.remove('active');
  } else {
    activeSymptoms.add(symptom);
    el.classList.add('active');
  }
}

let isRecording = false;
let recognition = null;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = function() {
    isRecording = true;
    document.getElementById('mic-status').innerHTML = "Listening... Speak now";
    document.getElementById('mic-btn').style.background = "var(--accent-red)";
    document.getElementById('mic-btn').style.boxShadow = "0 0 0 10px rgba(239, 68, 68, 0.2), 0 0 0 20px rgba(239, 68, 68, 0.1)";
  };

  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    const textArea = document.getElementById('symptom-text');
    if (textArea) {
      textArea.value = textArea.value ? textArea.value + " " + transcript : transcript;
    }
  };

  recognition.onerror = function(event) {
    console.error("Speech recognition error", event.error);
    document.getElementById('mic-status').innerHTML = "Error occurred. Tap mic to try again.";
  };

  recognition.onend = function() {
    isRecording = false;
    document.getElementById('mic-status').innerHTML = "Tap mic and speak<br>to describe symptoms";
    document.getElementById('mic-btn').style.background = "var(--primary)";
    document.getElementById('mic-btn').style.boxShadow = "0 0 0 10px rgba(26, 79, 214, 0.1), 0 0 0 20px rgba(26, 79, 214, 0.05)";
  };
}

function toggleRecording() {
  if (!recognition) {
    alert("Speech recognition is not supported in this browser.");
    return;
  }
  if (isRecording) {
    recognition.stop();
  } else {
    const langSelect = document.getElementById('voice-lang');
    if (langSelect) recognition.lang = langSelect.value;
    recognition.start();
  }
}

async function analyzeSymptoms() {
  const textArea = document.getElementById('symptom-text');
  const userText = textArea ? textArea.value.trim() : "";
  const selectedChips = Array.from(activeSymptoms).join(", ");
  
  const combinedSymptoms = `Text input: ${userText}\nSelected symptoms: ${selectedChips}`;
  
  if (!userText && activeSymptoms.size === 0) {
    alert("Please describe your symptoms or select from the common symptoms.");
    return;
  }
  
  const btn = document.getElementById('analyze-btn');
  btn.innerHTML = 'Analyzing... <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" style="margin-left:8px; display:inline-block;"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0110 10" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>';
  btn.disabled = true;

  try {
    const prompt = `Given the following patient symptoms:\n"${combinedSymptoms}"\n\nSuggest up to 2 medical departments that would be most appropriate. Select only from this exact list: [General Medicine, Cardiology, Orthopedics, Pediatrics, Gynecology, Neurology, ENT, Ophthalmology, Dermatology, Psychiatry].\n\nReturn the result strictly as a JSON array of objects, where each object has "dept" (string, the department name) and "match" (number, confidence percentage from 0 to 100). Do not include any other text or markdown formatting. Example: [{"dept": "General Medicine", "match": 85}, {"dept": "ENT", "match": 40}]`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error("Failed to fetch from Gemini API");
    }

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;
    
    // Clean up markdown block if present
    const cleanedText = resultText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    const suggestions = JSON.parse(cleanedText);
    
    renderSuggestions(suggestions);
  } catch (error) {
    console.error("Error analyzing symptoms:", error);
    alert("There was an error analyzing your symptoms. Please try again.");
  } finally {
    btn.innerHTML = 'Analyze Symptoms';
    btn.disabled = false;
  }
}

function renderSuggestions(suggestions) {
  const suggestionBox = document.getElementById('symptom-suggestion');
  const suggestionList = document.getElementById('suggested-depts');
  if (!suggestionBox || !suggestionList) return;

  suggestionList.innerHTML = '';
  
  if (suggestions && suggestions.length > 0) {
    suggestions.forEach((item, index) => {
      const dept = item.dept;
      const percentage = item.match;
      
      const div = document.createElement('div');
      div.className = 'suggested-dept stagger-item';
      div.style.animationDelay = `${index * 0.1}s`;
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.gap = '12px';
      div.style.background = 'white';
      div.style.padding = '12px';
      div.style.borderRadius = '8px';
      div.style.cursor = 'pointer';
      div.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
      div.onclick = () => selectDept(dept);

      div.innerHTML = `
        ${deptEmojis[dept] || '<div class="dept-icon" style="background:#f1f5f9;color:#64748b;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg></div>'}
        <div style="display:flex; flex-direction:column; gap:4px;">
            <div class="dept-name" style="font-weight:600; font-size:14px; color:var(--gray-800);">${dept}</div>
        </div>
        <div class="confidence" style="background:#dcfce7; color:#16a34a; font-size:12px; font-weight:600; padding:4px 10px; border-radius:12px;">${percentage}% Match</div>
      `;
      suggestionList.appendChild(div);
    });

    suggestionBox.style.display = 'block';
  } else {
    suggestionBox.style.display = 'none';
  }
}

// ---- Selection Handlers ----
const bookingData = {
  dept: '',
  doctor: '',
  date: '',
  time: '',
  visitType: 'In-Person Visit'
};

function selectDept(dept) {
  document.querySelectorAll('.dept-item').forEach(item => {
    if (item.dataset.dept === dept) item.classList.add('selected');
    else item.classList.remove('selected');
  });
  bookingData.dept = dept;
  document.getElementById('s-dept') && (document.getElementById('s-dept').textContent = dept);
  document.getElementById('c-dept') && (document.getElementById('c-dept').textContent = dept);
}

function handleStep1Next() {
  if (!bookingData.dept) {
    alert("Please select a department to proceed.");
    return;
  }
  goToStep(2);
}

function selectDoctor(el, doctorName) {
  document.querySelectorAll('.doctor-card').forEach(card => card.classList.remove('selected'));
  el.classList.add('selected');
  bookingData.doctor = doctorName;

  document.getElementById('s-doctor') && (document.getElementById('s-doctor').textContent = doctorName);
  document.getElementById('c-doctor') && (document.getElementById('c-doctor').textContent = doctorName);
}

function handleStep2Next() {
  if (!bookingData.doctor) {
    alert("Please select a doctor to proceed.");
    return;
  }
  goToStep(3);
}

function selectDate(el) {
  if (el.classList.contains('disabled')) return;
  document.querySelectorAll('.calendar-day').forEach(day => day.classList.remove('selected'));
  el.classList.add('selected');

  const dateStr = el.textContent.trim() + ' Sep 2026';
  bookingData.date = dateStr;

  document.getElementById('s-date') && (document.getElementById('s-date').textContent = dateStr);
  updateConfirmDateTime();
}

function selectTime(el) {
  if (el.classList.contains('unavailable')) return;
  document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
  el.classList.add('selected');

  bookingData.time = el.textContent.trim();

  document.getElementById('s-time') && (document.getElementById('s-time').textContent = bookingData.time);
  updateConfirmDateTime();
}

function updateConfirmDateTime() {
  const dtStr = (bookingData.date || '01 Sep 2026') + ', ' + (bookingData.time || '10:00 AM');
  document.getElementById('c-datetime') && (document.getElementById('c-datetime').textContent = dtStr);
}

function selectVisit(el) {
  document.querySelectorAll('.radio-option').forEach(opt => opt.classList.remove('selected'));
  el.classList.add('selected');
}

// ---- Filters & Search ----
function filterDepts() {
  const query = document.getElementById('dept-search').value.toLowerCase();
  document.querySelectorAll('#dept-list .dept-item').forEach(item => {
    const name = item.querySelector('h4').textContent.toLowerCase();
    const desc = item.querySelector('p').textContent.toLowerCase();
    if (name.includes(query) || desc.includes(query)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

function filterDoctors(el, filter) {
  document.querySelectorAll('.filter-group .filter-btn').forEach(btn => btn.classList.remove('active'));
  el.classList.add('active');

  const cards = document.querySelectorAll('#doctor-list .doctor-card');
  cards.forEach(card => {
    card.style.display = 'flex';
    if (filter === 'female' && card.dataset.gender !== 'female') {
      card.style.display = 'none';
    } else if (filter === 'male' && card.dataset.gender !== 'male') {
      card.style.display = 'none';
    }
    // 'available' and 'all' just show everything in this static demo
  });
}

// ---- General Tab Switching ----
function switchTab(el, tabId, groupClass = '.tab') {
  const tabsContainer = el.closest('.tabs');
  if (tabsContainer) {
    tabsContainer.querySelectorAll(groupClass).forEach(t => t.classList.remove('active'));
  } else {
    // If not in a container, search globally within the same parent
    const parent = el.parentElement;
    if (parent) parent.querySelectorAll(groupClass).forEach(t => t.classList.remove('active'));
  }
  el.classList.add('active');

  // Hide all sections that belong to these tabs (assumes data-target attributes or predictable IDs)
  // Need to be implemented per page if specific logic is required. 
  // For basic cases, rely on page-specific inline onclick or generic ID toggling if data-target is provided.
  if (el.dataset.target) {
    const siblings = el.parentElement.querySelectorAll(groupClass);
    siblings.forEach(sib => {
      if (sib.dataset.target) {
        const tgt = document.getElementById(sib.dataset.target);
        if (tgt) { tgt.classList.add('hidden'); tgt.style.display = 'none'; }
      }
    });
    const target = document.getElementById(el.dataset.target);
    if (target) {
      target.classList.remove('hidden');
      target.style.display = 'flex';
    }
  }
}

// Handle generic click feedback
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('button, a, .quick-action, .dept-item, .doctor-card, .appointment-card, .hospital-card, .record-item, .family-card, .profile-menu-item, .calendar-day, .time-slot').forEach(el => {
    el.addEventListener('touchstart', () => { }, { passive: true });
  });

  // Initialize booking wizard if on that page
  if (document.getElementById('step-1')) {
    goToStep(1);

    // Default date/time if not selected
    if (!bookingData.date) bookingData.date = '01 Sep 2026';
    if (!bookingData.time) bookingData.time = '10:00 AM';
  }

  // Handle dashboard conditional rendering
  if (localStorage.getItem('appointmentBooked') === 'true') {
    const queueCard = document.getElementById('dashboard-queue-card');
    const upcomingSection = document.getElementById('dashboard-upcoming-section');
    if (queueCard) queueCard.style.display = 'block';
    if (upcomingSection) upcomingSection.style.display = 'block';

    try {
      const dataStr = localStorage.getItem('bookedAppointmentData');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        // data.date is like "01 Sep 2026"
        if (data.date) {
          const parts = data.date.split(' ');
          if (parts.length >= 2) {
            const elDay = document.getElementById('dash-appt-day');
            const elMonth = document.getElementById('dash-appt-month');
            if (elDay) elDay.textContent = parts[0];
            if (elMonth) elMonth.textContent = parts[1];
          }
        }
        if (data.time) {
          const elTime = document.getElementById('dash-appt-time');
          if (elTime) elTime.textContent = data.time;
        }
        if (data.doctor) {
          const elDoctor = document.getElementById('dash-appt-doctor');
          if (elDoctor) elDoctor.textContent = data.doctor;
        }
        if (data.dept) {
          const elDept = document.getElementById('dash-appt-dept');
          if (elDept) elDept.textContent = data.dept;
        }
      }
    } catch(e) {
      console.error("Error reading booked appointment data", e);
    }
  }
});

console.log('SGHMS Application Logic Loaded (Multi-Page).');
