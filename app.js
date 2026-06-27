/* ==========================================================================
   AEQUITAS CORE APPLICATION LOGIC & DATA ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  // ==================== STATE MANAGEMENT ====================
  const state = {
    activeTab: 'analyzer',
    isCaseAnalyzed: false,
    analyzedCategory: null,
    analyzedData: null,
    selectedLawyer: null,
    isWorkspaceInitialized: false,
    userType: null, // 'client' or 'lawyer'
    userProfile: null,
    workspaceData: {
      lawyer: null,
      caseTitle: '',
      caseCategory: '',
      pricing: { name: '', price: '', desc: '' },
      messages: [],
      documents: [],
      activeDocument: null,
      roadmapPhase: 1
    }
  };

  // ==================== ONBOARDING FLOW CONTROLLER ====================
  let onboardingRole = 'client'; // 'client' or 'lawyer'
  let onboardingContactType = 'phone'; // 'phone' or 'email'
  let onboardingContactVal = '';
  let otpTimerInterval = null;
  let clientAvatarBase64 = null;
  let lawyerAvatarBase64 = null;

  // Onboarding selectors
  const onboardingOverlay = document.getElementById('onboarding-overlay');
  const onboardingStep1 = document.getElementById('onboarding-step-1');
  const onboardingStep2 = document.getElementById('onboarding-step-2');
  const onboardingStep3Client = document.getElementById('onboarding-step-3-client');
  const onboardingStep3Lawyer = document.getElementById('onboarding-step-3-lawyer');
  const authForm = document.getElementById('onboarding-auth-form');
  const otpForm = document.getElementById('onboarding-otp-form');
  const clientProfileForm = document.getElementById('onboarding-client-profile-form');
  const lawyerProfileForm = document.getElementById('onboarding-lawyer-profile-form');
  const contactInput = document.getElementById('onboarding-contact-input');
  const otpTimerSeconds = document.getElementById('otp-timer-seconds');
  const btnResendOtp = document.getElementById('btn-resend-otp');
  const btnBackStep1 = document.getElementById('btn-back-to-step1');

  // Avatar inputs
  const clientAvatarFile = document.getElementById('client-avatar-file');
  const clientAvatarPreview = document.getElementById('client-avatar-preview');
  const lawyerAvatarFile = document.getElementById('lawyer-avatar-file');
  const lawyerAvatarPreview = document.getElementById('lawyer-avatar-preview');

  // Toggle authentication fields (Email vs Phone)
  const authToggleBtns = document.querySelectorAll('.auth-toggle-btn');
  authToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      authToggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onboardingContactType = btn.getAttribute('data-type');
      if (onboardingContactType === 'phone') {
        contactInput.type = 'text';
        contactInput.placeholder = 'Enter your mobile number...';
      } else {
        contactInput.type = 'text';
        contactInput.placeholder = 'Enter your email address...';
      }
      contactInput.value = '';
    });
  });

  // Step 1: Submit Contact info
  authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    onboardingContactVal = contactInput.value.trim();
    onboardingRole = document.querySelector('input[name="onboarding-role"]:checked').value;
    
    // Update OTP text
    const hint = document.getElementById('otp-hint-text');
    hint.textContent = `We sent a 4-digit code to your ${onboardingContactType === 'phone' ? 'phone' : 'email'} at ${onboardingContactVal}. (Use code 1234 to proceed)`;

    // Swap steps
    onboardingStep1.style.display = 'none';
    onboardingStep2.style.display = 'flex';
    
    // Start countdown timer
    startOtpCountdown();
    
    // Clear and focus first OTP box
    const otpBoxes = document.querySelectorAll('.otp-input-box');
    otpBoxes.forEach(box => { box.value = ''; });
    otpBoxes[0].focus();
    lucide.createIcons();
  });

  // Back button in Step 2
  btnBackStep1.addEventListener('click', () => {
    onboardingStep2.style.display = 'none';
    onboardingStep1.style.display = 'flex';
    clearInterval(otpTimerInterval);
  });

  // OTP Countdown timer
  function startOtpCountdown() {
    let timeLeft = 30;
    otpTimerSeconds.textContent = timeLeft;
    btnResendOtp.disabled = true;
    clearInterval(otpTimerInterval);

    otpTimerInterval = setInterval(() => {
      timeLeft--;
      otpTimerSeconds.textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(otpTimerInterval);
        btnResendOtp.disabled = false;
      }
    }, 1000);
  }

  // Resend OTP button
  btnResendOtp.addEventListener('click', () => {
    startOtpCountdown();
    alert('Mock OTP Code resent successfully! Type "1234" to proceed.');
  });

  // OTP inputs auto-tabbing
  const otpBoxes = document.querySelectorAll('.otp-input-box');
  otpBoxes.forEach((box, index) => {
    // Keydown for backspace deletion support
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && index > 0) {
        otpBoxes[index - 1].value = '';
        otpBoxes[index - 1].focus();
      }
    });

    // Input event for character entry (fully compatible with mobile keyboards)
    box.addEventListener('input', (e) => {
      const val = box.value;
      if (val && index < otpBoxes.length - 1) {
        otpBoxes[index + 1].focus();
      }
    });
  });

  // Handle direct clipboard paste in the first OTP box
  if (otpBoxes[0]) {
    otpBoxes[0].addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData('text');
      if (pasteData && pasteData.length >= 4) {
        otpBoxes.forEach((box, idx) => {
          if (pasteData[idx]) {
            box.value = pasteData[idx];
          }
        });
        otpBoxes[otpBoxes.length - 1].focus();
      }
    });
  }

  // Step 2: Submit OTP verification
  otpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let enteredCode = '';
    otpBoxes.forEach(box => { enteredCode += box.value; });

    // Validate (accept any code for prototype, default 1234)
    clearInterval(otpTimerInterval);
    onboardingStep2.style.display = 'none';

    // Route to appropriate profile builder
    if (onboardingRole === 'client') {
      onboardingStep3Client.style.display = 'flex';
    } else {
      onboardingStep3Lawyer.style.display = 'flex';
    }
    lucide.createIcons();
  });

  // Image Upload FileReaders
  clientAvatarFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        clientAvatarBase64 = event.target.result;
        clientAvatarPreview.innerHTML = `<img src="${clientAvatarBase64}" alt="Client Avatar" style="width: 100%; height: 100%; object-fit: cover;">`;
        clientAvatarPreview.classList.add('loaded');
      };
      reader.readAsDataURL(file);
    }
  });

  lawyerAvatarFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        lawyerAvatarBase64 = event.target.result;
        lawyerAvatarPreview.innerHTML = `<img src="${lawyerAvatarBase64}" alt="Lawyer Avatar" style="width: 100%; height: 100%; object-fit: cover;">`;
        lawyerAvatarPreview.classList.add('loaded');
      };
      reader.readAsDataURL(file);
    }
  });

  // Step 3A: Submit Client Profile
  clientProfileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('client-name').value.trim();
    const city = document.getElementById('client-city').value.trim();
    const interestVal = document.getElementById('client-interest').value;

    const requestBody = {
      name,
      city,
      contact: onboardingContactVal,
      avatar: clientAvatarBase64,
      interest: interestVal
    };

    fetch('/api/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    .then(res => {
      if (!res.ok) throw new Error('Client profile registration failed.');
      return res.json();
    })
    .then(data => {
      state.userType = 'client';
      state.userProfile = data.client;

      // Update Client Status UI in header
      const userRoleEl = document.querySelector('.user-role');
      const statusTextEl = document.querySelector('.status-text');
      const statusIndicator = document.querySelector('.status-indicator');
      
      userRoleEl.textContent = name;
      statusTextEl.textContent = `${city} • Client`;
      statusIndicator.className = 'status-indicator active';
      statusIndicator.style.backgroundColor = 'var(--accent-indigo)';

      // Update avatar circle in header status card
      const userStatusCard = document.getElementById('user-status');
      let avatarCircle = userStatusCard.querySelector('.avatar-header-circle');
      if (!avatarCircle) {
        avatarCircle = document.createElement('div');
        avatarCircle.className = 'avatar-header-circle';
        avatarCircle.style.width = '32px';
        avatarCircle.style.height = '32px';
        avatarCircle.style.borderRadius = '50%';
        avatarCircle.style.marginRight = '8px';
        avatarCircle.style.overflow = 'hidden';
        avatarCircle.style.background = 'linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan))';
        avatarCircle.style.display = 'flex';
        avatarCircle.style.alignItems = 'center';
        avatarCircle.style.justify = 'center';
        avatarCircle.style.color = 'white';
        avatarCircle.style.fontSize = '10px';
        avatarCircle.style.fontWeight = 'bold';
        
        userStatusCard.insertBefore(avatarCircle, userStatusCard.firstChild);
      }

      if (clientAvatarBase64) {
        avatarCircle.innerHTML = `<img src="${clientAvatarBase64}" style="width:100%; height:100%; object-fit:cover;">`;
      } else {
        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        avatarCircle.textContent = initials || 'CL';
      }

      // Dynamic case analyzer autofill city/interest
      filterSpecialty.value = interestVal;
      
      // Hide onboarding overlay
      onboardingOverlay.style.display = 'none';
    })
    .catch(err => {
      alert('Error registering client: ' + err.message);
      console.error(err);
    });
  });

  // Step 3B: Submit Lawyer Profile
  lawyerProfileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('lawyer-name').value.trim();
    const gender = document.getElementById('lawyer-gender').value;
    const city = document.getElementById('lawyer-city').value.trim();
    const position = document.getElementById('lawyer-position').value;
    const specialty = document.getElementById('lawyer-specialty-type').value;
    const exp = document.getElementById('lawyer-exp').value;
    const fought = parseInt(document.getElementById('lawyer-fought').value);
    const ongoing = parseInt(document.getElementById('lawyer-ongoing').value);
    const won = parseInt(document.getElementById('lawyer-won').value);
    const fees = document.getElementById('lawyer-fees').value.trim();
    const contactInfo = document.getElementById('lawyer-contact-info').value.trim();

    const requestBody = {
      name,
      gender,
      city,
      position,
      specialty,
      exp,
      fought,
      ongoing,
      won,
      fees,
      contactInfo,
      avatarBase64: lawyerAvatarBase64
    };

    fetch('/api/lawyers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    .then(res => {
      if (!res.ok) {
        return res.json().then(errData => {
          throw new Error(errData.details ? errData.details.join('\n') : errData.error || 'Failed to register');
        });
      }
      return res.json();
    })
    .then(data => {
      const newLawyer = data.lawyer;

      // Prepend to lawyers array
      LAWYERS_DATABASE.unshift(newLawyer);

      state.userType = 'lawyer';
      state.userProfile = newLawyer;

      // Update Status UI in header
      const userRoleEl = document.querySelector('.user-role');
      const statusTextEl = document.querySelector('.status-text');
      const statusIndicator = document.querySelector('.status-indicator');
      
      userRoleEl.textContent = name;
      statusTextEl.textContent = `${city} • Advocate`;
      statusIndicator.className = 'status-indicator active';
      statusIndicator.style.backgroundColor = 'var(--accent-cyan)';

      // Update avatar circle in header status card
      const userStatusCard = document.getElementById('user-status');
      let avatarCircle = userStatusCard.querySelector('.avatar-header-circle');
      if (!avatarCircle) {
        avatarCircle = document.createElement('div');
        avatarCircle.className = 'avatar-header-circle';
        avatarCircle.style.width = '32px';
        avatarCircle.style.height = '32px';
        avatarCircle.style.borderRadius = '50%';
        avatarCircle.style.marginRight = '8px';
        avatarCircle.style.overflow = 'hidden';
        avatarCircle.style.background = 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))';
        avatarCircle.style.display = 'flex';
        avatarCircle.style.alignItems = 'center';
        avatarCircle.style.justify = 'center';
        avatarCircle.style.color = 'white';
        avatarCircle.style.fontSize = '10px';
        avatarCircle.style.fontWeight = 'bold';
        
        userStatusCard.insertBefore(avatarCircle, userStatusCard.firstChild);
      }

      if (lawyerAvatarBase64) {
        avatarCircle.innerHTML = `<img src="${lawyerAvatarBase64}" style="width:100%; height:100%; object-fit:cover;">`;
      } else {
        avatarCircle.textContent = newLawyer.avatarText;
      }

      // Close overlay
      onboardingOverlay.style.display = 'none';

      // Reload lawyers database and then route to directory to show the card
      loadLawyers().then(() => {
        renderLawyers();
        switchTab('matchmaker');
      });
    })
    .catch(err => {
      alert('Registration error:\n' + err.message);
      console.error(err);
    });
  });

  // ==================== BACKEND DATABASE INTEGRATION ====================
  let LAWYERS_DATABASE = [];

  async function loadLawyers() {
    try {
      const response = await fetch('/api/lawyers');
      if (response.ok) {
        LAWYERS_DATABASE = await response.json();
      } else {
        console.error("API returned error status fetching lawyers:", response.status);
      }
    } catch (error) {
      console.error("Failed to load lawyers from backend:", error);
    }
  }

  // Load lawyers immediately on startup
  loadLawyers().then(() => {
    renderLawyers();
  });

  const MOCK_CONTRACT_AUDITS = {
    lease: {
      fileName: 'LeaseAgreement_Draft.pdf',
      fileSize: '1.8 MB',
      score: '3 Warnings Found',
      clauses: [
        {
          num: 'Section 14(b) - Fees',
          severity: 'warning',
          severityText: 'Legal Violation',
          original: '“In the event Rent is not received by the 2nd day, Tenant agrees to pay a late fee of $150.00, plus an additional $25.00 for every day the payment remains unpaid.”',
          explanation: 'This late fee structure is punitive and disproportionate. Local laws limit late fees to a reasonable cost incurred by the landlord, typically capped at 5% of monthly rent.',
          remedy: 'Request that the daily compounding fee be deleted and the late fee capped at 5% after a 5-day grace period.'
        },
        {
          num: 'Section 8(c) - Entry',
          severity: 'warning',
          severityText: 'Legal Violation',
          original: '“Landlord reserves the full right to enter the leased premises at any hour, without prior notification, for inspection, cleaning, repairs, or showing.”',
          explanation: 'Violates the tenant’s right to Quiet Enjoyment. State law requires landlords to give at least 24 hours advance written notice before entry, except in emergencies.',
          remedy: 'Change wording to: "Landlord shall provide at least 24 hours advance written notice of intent to enter, and entry must occur during normal business hours."'
        },
        {
          num: 'Section 22 - Liability',
          severity: 'caution',
          severityText: 'Severely Landlord-Tilted',
          original: '“Tenant waives all rights to sue Landlord for damages, personal injuries, or theft occurring on the premises, regardless of Landlord’s negligence.”',
          explanation: 'Courts routinely strike down clauses that attempt to exempt landlords from liability for their own negligence. This clause is likely unenforceable but remains in lease to deter lawsuits.',
          remedy: 'Request that "regardless of Landlord’s negligence" be replaced with "except in cases of Landlord’s negligence or willful misconduct."'
        }
      ]
    },
    freelance: {
      fileName: 'FreelanceDesign_NDA_Services.docx',
      fileSize: '412 KB',
      score: '2 Warnings, 1 Caution',
      clauses: [
        {
          num: 'Section 4(a) - IP Transfer',
          severity: 'warning',
          severityText: 'Extreme Risk',
          original: '“All intellectual property rights in the designs transfer to the Client immediately upon creation, irrespective of invoice payment status.”',
          explanation: 'This means the client legally owns your work before they pay you. If they fail to pay, you cannot sue for copyright infringement, only for breach of contract.',
          remedy: 'Change wording to: "Intellectual property rights shall transfer to the Client only upon receipt of full payment of all outstanding invoices."'
        },
        {
          num: 'Section 7(e) - Revisions',
          severity: 'caution',
          severityText: 'Scope Creep Risk',
          original: '“Designer agrees to make edits, additions, and modifications to the work as requested by the Client until Client is fully satisfied.”',
          explanation: 'Allows client to demand unlimited revisions without additional compensation, leading to severe scope creep.',
          remedy: 'Amend to: "Pricing includes up to two (2) rounds of major revisions. Any additional revisions will be billed at $75/hour."'
        },
        {
          num: 'Section 11 - Disputes',
          severity: 'warning',
          severityText: 'Waives Rights',
          original: '“Any dispute under this Agreement must be submitted to binding arbitration in Wilmington, Delaware. Designer waives all rights to bring class action claims.”',
          explanation: 'Delaware arbitration is extremely expensive for an individual contractor and forces you to travel/hire out-of-state lawyers for small invoice disputes.',
          remedy: 'Request that the dispute venue be set to your local county court, and allow Small Claims action as an option before arbitration.'
        }
      ]
    }
  };

  const MOCK_CHAT_ANSWERS = [
    {
      keywords: ['hello', 'hi', 'hey', 'start'],
      response: 'Hello! I’m glad to connect with you here. Let’s make sure we have your documents in place. Have you uploaded your lease or agreement in the Files section on the right? That’s our best starting point.'
    },
    {
      keywords: ['uploaded', 'file', 'lease', 'contract', 'document'],
      response: 'Excellent, I see the file. If you haven’t done so already, go ahead and click the "Scan File" button next to it. Our system runs an instant legal health-check, and then I will outline exactly which sections are problematic so we can draft our demand letter.'
    },
    {
      keywords: ['court', 'sue', 'judge', 'small claims'],
      response: 'Small Claims is highly effective for this amount. The judge will look for three things: a signed contract, evidence of breach (like photos or invoices), and proof that we tried to resolve it beforehand (our formal demand letter). We are currently on Step 1: drafting that letter.'
    },
    {
      keywords: ['fee', 'payment', 'money', 'cost', 'escrow'],
      response: 'Your payment is currently held securely in Aequitas Escrow. I will only receive those funds once we conclude this phase (sending the formal letter and receiving their response). You have complete control over releases.'
    },
    {
      keywords: ['help', 'advice', 'should i'],
      response: 'Based on the facts, the law is on your side. My advice is to maintain all communication in writing. If they call you, follow up with an email summarizing what was said. This creates a paper trail that judges love.'
    }
  ];

  // ==================== ELEMENTS SELECTORS ====================
  const navTabsContainer = document.getElementById('nav-tabs-container');
  const sections = document.querySelectorAll('.content-section');
  const navTabButtons = document.querySelectorAll('.nav-tab');

  // Tab 1 Elements
  const caseInput = document.getElementById('case-description-input');
  const charCount = document.getElementById('char-count');
  const btnRunAnalysis = document.getElementById('btn-run-analysis');
  const promptChips = document.querySelectorAll('.prompt-chip');
  const analyzerInitialState = document.getElementById('analyzer-initial-state');
  const analyzerLoadingState = document.getElementById('analyzer-loading-state');
  const analyzerSuccessState = document.getElementById('analyzer-success-state');
  const loadingStatusText = document.getElementById('loading-status-text');
  
  // Tab 1 Success Outputs
  const resCaseCategory = document.getElementById('result-case-category');
  const resCaseTitle = document.getElementById('result-case-title');
  const resViabilityCircle = document.getElementById('viability-progress-circle');
  const resViabilityPercent = document.getElementById('viability-percent');
  const resClaimValue = document.getElementById('result-claim-value');
  const resActionability = document.getElementById('result-actionability');
  const resFilingCosts = document.getElementById('result-filing-costs');
  const resNarrative = document.getElementById('result-narrative');
  const resStepsList = document.getElementById('result-steps-list');
  const btnGoToMatchmaker = document.getElementById('btn-go-to-matchmaker');

  // Tab 2 Elements
  const filterSpecialty = document.getElementById('filter-specialty');
  const filterPricing = document.getElementById('filter-pricing');
  const filterExperience = document.getElementById('filter-experience');
  const activeCaseFilterTag = document.getElementById('active-case-filter-tag');
  const activeCaseCategoryName = document.getElementById('active-case-category-name');
  const btnClearCaseFilter = document.getElementById('btn-clear-case-filter');
  const lawyersListContainer = document.getElementById('lawyers-list-container');

  // Case Search Engine Elements
  const caseSearchBar = document.getElementById('case-search-bar');
  const btnSearchCases = document.getElementById('btn-search-cases');
  const searchRecommendationBox = document.getElementById('search-recommendation-box');
  const recCategoryName = document.getElementById('rec-category-name');

  // Booking Modal
  const bookingModal = document.getElementById('booking-modal');
  const bookingModalTitle = document.getElementById('booking-modal-title');
  const bookingLawyerMini = document.getElementById('booking-lawyer-mini');
  const modalPackagesContainer = document.getElementById('modal-packages-container');
  const bookingForm = document.getElementById('booking-form');
  const btnCloseModal = document.getElementById('btn-close-modal');

  // Tab 3 Elements
  const workspaceBadge = document.getElementById('workspace-badge');
  const workspaceEmptyContainer = document.getElementById('workspace-empty-container');
  const workspaceActiveContainer = document.getElementById('workspace-active-container');
  const btnWorkspaceQuickstart = document.getElementById('btn-workspace-quickstart');

  const wsLawyerAvatar = document.getElementById('ws-lawyer-avatar');
  const wsLawyerName = document.getElementById('ws-lawyer-name');
  const wsLawyerRole = document.getElementById('ws-lawyer-role');
  const wsRoadmapSteps = document.getElementById('ws-roadmap-steps');
  const wsPricingTag = document.getElementById('ws-pricing-tag');
  const wsPricingPrice = document.getElementById('ws-pricing-price');
  const wsPricingDesc = document.getElementById('ws-pricing-desc');

  const chatMessagesBox = document.getElementById('chat-messages-box');
  const chatInputForm = document.getElementById('chat-input-form');
  const chatMessageInput = document.getElementById('chat-message-input');

  const docUploadDropzone = document.getElementById('doc-upload-dropzone');
  const uploadedFilesList = document.getElementById('uploaded-files-list');
  const clauseAuditorContainer = document.getElementById('clause-auditor-container');
  const auditFileName = document.getElementById('audit-file-name');
  const auditScore = document.getElementById('audit-score');
  const auditClausesBox = document.getElementById('audit-clauses-box');
  const btnCloseAudit = document.getElementById('btn-close-audit');
  const mockDocBtns = document.querySelectorAll('.mock-doc-btn');
  const wsDocsCount = document.getElementById('ws-docs-count');

  // Accordion faq
  const faqQuestions = document.querySelectorAll('.faq-question');

  // ==================== SPA ROUTING ====================
  function switchTab(tabId) {
    state.activeTab = tabId;
    
    // Update navbar class
    navTabButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update section visibility
    sections.forEach(section => {
      if (section.id === `section-${tabId}`) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    // Clear workspace badge if user clicks workspace
    if (tabId === 'workspace') {
      workspaceBadge.style.display = 'none';
    }

    // Special scroll triggers or logic when entering tabs
    if (tabId === 'matchmaker') {
      loadLawyers().then(() => renderLawyers());
    }
  }

  // Bind tab clicks
  navTabsContainer.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.nav-tab');
    if (tabBtn) {
      const tabId = tabBtn.getAttribute('data-tab');
      switchTab(tabId);
    }
  });

  // ==================== TEXTAREA & CHIPS ====================
  caseInput.addEventListener('input', () => {
    charCount.textContent = caseInput.value.length;
  });

  promptChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.getAttribute('data-text');
      caseInput.value = text;
      charCount.textContent = text.length;
      caseInput.focus();
    });
  });

  // ==================== CASE ANALYZER LOGIC ====================
  btnRunAnalysis.addEventListener('click', () => {
    const description = caseInput.value.trim();
    if (!description) {
      alert('Please describe your legal situation before running the audit.');
      return;
    }

    // Trigger loading UI
    analyzerInitialState.style.display = 'none';
    analyzerSuccessState.style.display = 'none';
    analyzerLoadingState.style.display = 'flex';

    // Steps timing script
    const steps = [
      { id: 'step-1', text: 'Parsing statement & compiling entities...', delay: 0 },
      { id: 'step-2', text: 'Classifying domain, legal remedies & jurisdiction...', delay: 800 },
      { id: 'step-3', text: 'Estimating claim worth, costs & feasibility...', delay: 1600 },
      { id: 'step-4', text: 'Mapping strategic next steps & pre-vetted matching...', delay: 2400 }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        loadingStatusText.textContent = step.text;
        
        // Update check icons in steps
        const stepEl = document.getElementById(step.id);
        if (stepEl) {
          stepEl.classList.add('active');
          if (index > 0) {
            const prevEl = document.getElementById(steps[index-1].id);
            if (prevEl) {
              prevEl.classList.remove('active');
              prevEl.classList.add('complete');
              prevEl.innerHTML = '<i data-lucide="check-circle-2" class="text-emerald"></i> ' + prevEl.textContent.trim();
              lucide.createIcons({attrs: {class: 'text-emerald'}});
            }
          }
        }

        // Final Resolution
        if (index === steps.length - 1) {
          setTimeout(() => {
            const finalEl = document.getElementById(step.id);
            if (finalEl) {
              finalEl.classList.remove('active');
              finalEl.classList.add('complete');
              finalEl.innerHTML = '<i data-lucide="check-circle-2" class="text-emerald"></i> ' + finalEl.textContent.trim();
              lucide.createIcons({attrs: {class: 'text-emerald'}});
            }
            generateAnalysisReport(description);
          }, 800);
        }
      }, step.delay);
    });
  });

  function generateAnalysisReport(inputText) {
    const text = inputText.toLowerCase();
    let analysis = {
      category: 'Civil Dispute',
      title: 'Contract / Mutual Dispute',
      viability: 65,
      viabilityOffset: 221, // math calculation of stroke-dashoffset
      claimValue: '$1,200',
      actionability: 'Moderate',
      filingCosts: '$75 - $150',
      narrative: 'Based on your description, this dispute involves a general breach of mutual obligations. Since you have documentation, a breach of contract claim is viable. We advise requesting voluntary mediation before pursuing small claims actions.',
      steps: [
        'Collect all contract documents and communications in a secure folder.',
        'Send a formal settlement offer detailing the terms breached.',
        'If negotiation fails, draft a Small Claims summons.'
      ],
      filterTag: 'contract'
    };

    // Keyword Routing
    if (text.includes('landlord') || text.includes('tenant') || text.includes('deposit') || text.includes('rent') || text.includes('lease') || text.includes('apartment') || text.includes('roommate')) {
      analysis = {
        category: 'Tenancy & Real Estate',
        title: 'Security Deposit & Tenancy Dispute',
        viability: 82,
        viabilityColor: '#10b981',
        claimValue: '$1,500 - $3,000',
        actionability: 'Strong',
        filingCosts: '$45 - $90',
        narrative: 'Your landlord is legally required to return your security deposit within a strict statutory deadline (often 21 days) or provide an itemized list of deductions. Normal wear and tear (like light cabinet scratches) cannot be deducted. You have a very strong case if photos confirm the condition.',
        steps: [
          'Send a certified Tenant Demand Letter requesting full refund of deposit.',
          'Compile move-in inspection reports and dated photos.',
          'Request a formal pre-moveout inspection audit if relevant.'
        ],
        filterTag: 'tenancy'
      };
    } else if (text.includes('wage') || text.includes('freelance') || text.includes('invoice') || text.includes('unpaid') || text.includes('client') || text.includes('designer') || text.includes('contractor') || text.includes('payment') || text.includes('pay')) {
      analysis = {
        category: 'Employment & Labor Law',
        title: 'Unpaid Wages & Breach of Service Contract',
        viability: 75,
        viabilityColor: '#10b981',
        claimValue: '$3,200 - $5,000',
        actionability: 'Strong',
        filingCosts: '$50 - $110',
        narrative: 'Freelance agreements and employment contracts are fully enforceable. If services were rendered and accepted, withholding payment is a breach. Many jurisdictions impose prompt payment penalties on clients who stall freelance invoices.',
        steps: [
          'Send a formal "Letter of Intent to Sue" giving 7 business days to pay.',
          'Export PDF copies of your signed contract, emails approving work, and sent invoices.',
          'File an administrative wage claim with the state Department of Labor.'
        ],
        filterTag: 'employment'
      };
    } else if (text.includes('car') || text.includes('dealer') || text.includes('warranty') || text.includes('failed') || text.includes('lemon') || text.includes('repair') || text.includes('buy')) {
      analysis = {
        category: 'Consumer Protection',
        title: 'Used Car / Lemon Law Warranty Conflict',
        viability: 58,
        viabilityColor: '#f59e0b',
        claimValue: '$3,500 - $7,500',
        actionability: 'Moderate',
        filingCosts: '$120 - $220',
        narrative: 'Used car warranty claims depend heavily on the written warranty agreement ("As-Is" vs Certified Guarantee). Verbal promises during sales are notoriously hard to prove in court, but dealer failure to disclose known major defects (fraud) is actionable.',
        steps: [
          'Obtain an independent mechanic inspection documenting the cause of transmission failure.',
          'Send dealer a formal certified letter citing state consumer warranty statutes.',
          'File complaints with the State Attorney General and DMV Licensing Board.'
        ],
        filterTag: 'consumer'
      };
    }

    // Set state
    state.isCaseAnalyzed = true;
    state.analyzedCategory = analysis.filterTag;
    state.analyzedData = analysis;

    // Render results
    resCaseCategory.textContent = analysis.category;
    resCaseCategory.className = `pill-tag text-accent ${analysis.filterTag}`;
    resCaseTitle.textContent = analysis.title;
    
    // Viability circle computation
    const radius = 32;
    const circumference = 2 * Math.PI * radius; // ~201.06
    const strokeDashoffset = circumference - (analysis.viability / 100) * circumference;
    resViabilityCircle.style.strokeDashoffset = strokeDashoffset;
    resViabilityCircle.style.stroke = analysis.viability >= 70 ? '#10b981' : (analysis.viability >= 55 ? '#f59e0b' : '#f43f5e');
    resViabilityPercent.textContent = `${analysis.viability}%`;

    resClaimValue.textContent = analysis.claimValue;
    resActionability.textContent = analysis.actionability;
    resActionability.className = `value ${analysis.viability >= 70 ? 'text-emerald' : 'text-cyan'}`;
    resFilingCosts.textContent = analysis.filingCosts;
    resNarrative.textContent = analysis.narrative;

    // Next steps checklist
    resStepsList.innerHTML = '';
    analysis.steps.forEach(step => {
      const li = document.createElement('li');
      li.innerHTML = `
        <i data-lucide="check-square" class="text-emerald"></i>
        <div>
          <strong>Action:</strong> ${step}
        </div>
      `;
      resStepsList.appendChild(li);
    });

    // Reset icons in steps
    lucide.createIcons();

    // Show result dashboard
    analyzerLoadingState.style.display = 'none';
    analyzerSuccessState.style.display = 'block';

    // Show filter tag for lawyers
    activeCaseCategoryName.textContent = analysis.category.split(' ')[0];
    activeCaseFilterTag.style.display = 'flex';
  }

  // Link results to advocate matchmaker
  btnGoToMatchmaker.addEventListener('click', () => {
    switchTab('matchmaker');
    filterSpecialty.value = state.analyzedCategory;
    renderLawyers();
  });

  // ==================== ADVOCATE DIRECTORY FILTER LOGIC ====================
  function renderLawyers() {
    const specialtyVal = filterSpecialty.value;
    const pricingVal = filterPricing.value;
    const expVal = filterExperience.value;

    lawyersListContainer.innerHTML = '';

    const filtered = LAWYERS_DATABASE.filter(lawyer => {
      // Specialty Filter
      if (specialtyVal !== 'all' && lawyer.specialty !== specialtyVal) return false;
      
      // Pricing Filter
      if (pricingVal !== 'all') {
        const hasMatchingPackage = lawyer.packages.some(pkg => {
          if (pricingVal === 'flat' && pkg.price.includes('$') && parseInt(pkg.price.replace('$', '')) < 1000) return true;
          if (pricingVal === 'hourly' && pkg.name.toLowerCase().includes('hourly')) return true;
          if (pricingVal === 'contingency' && pkg.price.toLowerCase().includes('contingency')) return true;
          return false;
        });
        
        // Add manual check since some prices represent flat package rates
        if (pricingVal === 'flat' && !lawyer.packages.some(p => p.price !== 'Contingency')) return false;
        if (pricingVal === 'contingency' && !lawyer.packages.some(p => p.price.toLowerCase().includes('contingency'))) return false;
      }

      // Performance Filter
      if (expVal === 'high') {
        const rate = parseInt(lawyer.winRate.replace('%', ''));
        if (rate < 92) return false;
      } else if (expVal === 'medium') {
        const rate = parseInt(lawyer.winRate.replace('%', ''));
        if (rate < 80) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      lawyersListContainer.innerHTML = `
        <div class="glass-card" style="grid-column: span 3; text-align: center; padding: 40px;">
          <i data-lucide="users-round" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 12px;"></i>
          <h4>No advocates match this specific filter</h4>
          <p style="color: var(--text-secondary); margin-top: 4px;">Try loosening your filters or resetting the category.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    filtered.forEach(lawyer => {
      const card = document.createElement('div');
      card.className = 'glass-card lawyer-card file-folder-card';
      
      // Build package elements
      let packagesHTML = '';
      lawyer.packages.forEach(pkg => {
        packagesHTML += `
          <div class="package-item">
            <span class="package-name">${pkg.name}</span>
            <span class="package-price">${pkg.price}</span>
          </div>
        `;
      });

      const avatarHTML = lawyer.avatarBase64 
        ? `<img src="${lawyer.avatarBase64}" alt="${lawyer.name}" style="width:100%; height:100%; object-fit:cover;">`
        : lawyer.avatarText;

      card.innerHTML = `
        <div class="lawyer-card-header">
          <div class="avatar">${avatarHTML}</div>
          <div class="lawyer-meta">
            <h3>${lawyer.name}</h3>
            <span class="specialty-label text-accent ${lawyer.specialty}">${lawyer.specialtyLabel}</span>
            <span class="bar-verification-tag"><i data-lucide="shield-check"></i> Bar Verified & Active</span>
          </div>
        </div>
        <div class="lawyer-perf">
          <div class="perf-stat">
            <span class="label">win rate</span>
            <span class="val text-emerald">${lawyer.winRate}</span>
          </div>
          <div class="perf-stat">
            <span class="label">similar cases</span>
            <span class="val">${lawyer.casesHandled}+</span>
          </div>
        </div>
        <p class="lawyer-card-desc">${lawyer.bio}</p>
        <div class="lawyer-packages">
          <span class="packages-heading">fixed packages</span>
          <div class="packages-list">
            ${packagesHTML}
          </div>
        </div>

        <!-- Expandable Track Record Timeline -->
        <button class="btn-track-record-toggle" data-id="${lawyer.id}">
          <span>📁 Track Record (${lawyer.verified_cases ? lawyer.verified_cases.length : 0} Verified Cases)</span>
          <i data-lucide="chevron-down" style="width:14px; height:14px;"></i>
        </button>
        <div class="track-record-timeline" id="tr-timeline-${lawyer.id}" style="display: none;">
          ${(lawyer.verified_cases || []).map(c => `
            <div class="timeline-case-item">
              <span class="timeline-case-year">${c.year}</span>
              <div class="timeline-case-title">${c.case_type}</div>
              <div class="timeline-case-meta">${c.court_level} • ${c.role}</div>
            </div>
          `).join('')}
          <div class="demo-data-disclaimer">
            Demo data — a production version would pull verified case history from eCourts/NJDG public advocate records.
          </div>
        </div>

        <!-- AI Plausibility Check Box -->
        <div class="ai-plausibility-check-box">
          <label>Check if they've handled a case like yours:</label>
          <div class="ai-check-input-wrapper">
            <input type="text" class="ai-check-text-input" id="ai-input-${lawyer.id}" placeholder="Describe your case context..." required>
            <button type="button" class="btn-ai-submit" data-id="${lawyer.id}">
              <i data-lucide="sparkles" style="width:12px; height:12px;"></i> Check
            </button>
          </div>
          <div class="verdict-stamp-container" id="ai-verdict-container-${lawyer.id}" style="display: none;"></div>
        </div>

        <div class="lawyer-footer" style="margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.05);">
          <button class="btn btn-primary btn-book-consult w-full" data-id="${lawyer.id}">
            Book Consultation
          </button>
        </div>
      `;
      
      lawyersListContainer.appendChild(card);
    });

    // Add listeners to book consultation buttons
    const bookBtns = lawyersListContainer.querySelectorAll('.btn-book-consult');
    bookBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const lawyerId = btn.getAttribute('data-id');
        openBookingModal(lawyerId);
      });
    });

    // Add listeners to track record toggle buttons
    const trBtns = lawyersListContainer.querySelectorAll('.btn-track-record-toggle');
    trBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const lawyerId = btn.getAttribute('data-id');
        const timelineDiv = document.getElementById(`tr-timeline-${lawyerId}`);
        const icon = btn.querySelector('i');
        
        if (timelineDiv.style.display === 'none') {
          timelineDiv.style.display = 'block';
          icon.setAttribute('data-lucide', 'chevron-up');
        } else {
          timelineDiv.style.display = 'none';
          icon.setAttribute('data-lucide', 'chevron-down');
        }
        lucide.createIcons();
      });
    });

    // Add listeners to AI Plausibility check buttons
    const aiBtns = lawyersListContainer.querySelectorAll('.btn-ai-submit');
    aiBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const lawyerId = btn.getAttribute('data-id');
        const lawyer = LAWYERS_DATABASE.find(l => l.id === lawyerId);
        const inputField = document.getElementById(`ai-input-${lawyerId}`);
        const verdictContainer = document.getElementById(`ai-verdict-container-${lawyerId}`);
        const queryText = inputField.value.trim();

        if (!queryText) {
          alert('Please enter a description of your case first!');
          return;
        }

        // Show loading state
        btn.disabled = true;
        verdictContainer.style.display = 'block';
        verdictContainer.innerHTML = `
          <div style="font-family: var(--font-mono); font-size:11px; color: var(--text-secondary); display: flex; align-items:center; gap:6px;">
            <span class="pulse" style="width:8px; height:8px; background:var(--color-thread); border-radius:50%;"></span>
            Auditing case database with Claude...
          </div>
        `;

        try {
          // Perform check (Anthropic API with mock fallback)
          const result = await checkPlausibilityWithClaude(lawyer, queryText);
          
          const stampClass = result.plausible_match ? 'match' : 'no-match';
          const stampText = result.plausible_match ? 'PLAUSIBLE MATCH' : 'LOW PLAUSIBILITY';

          verdictContainer.innerHTML = `
            <div class="verdict-stamp ${stampClass}">
              ${stampText}
            </div>
            <p class="verdict-stamp-explanation">${result.explanation}</p>
          `;
        } catch (err) {
          verdictContainer.innerHTML = `
            <p style="color:var(--accent-rose); font-size:11px; font-family:var(--font-mono);">
              Audit failed. Please try again.
            </p>
          `;
        } finally {
          btn.disabled = false;
        }
      });
    });

    lucide.createIcons();
  }

  // Filter triggers
  filterSpecialty.addEventListener('change', renderLawyers);
  filterPricing.addEventListener('change', renderLawyers);
  filterExperience.addEventListener('change', renderLawyers);

  btnClearCaseFilter.addEventListener('click', () => {
    state.analyzedCategory = null;
    filterSpecialty.value = 'all';
    activeCaseFilterTag.style.display = 'none';
    caseSearchBar.value = '';
    searchRecommendationBox.style.display = 'none';
    renderLawyers();
  });

  // ==================== DYNAMIC CASE SEARCH ENGINE ====================
  function executeCaseSearch() {
    const query = caseSearchBar.value.trim().toLowerCase();
    if (!query) {
      searchRecommendationBox.style.display = 'none';
      filterSpecialty.value = 'all';
      renderLawyers();
      return;
    }

    let recommendedCat = 'all';
    let recommendedLabel = '';

    // Keywords mapping
    if (query.includes('land') || query.includes('rent') || query.includes('deposit') || query.includes('lease') || query.includes('tenant') || query.includes('landlord') || query.includes('apartment') || query.includes('housing') || query.includes('eviction')) {
      recommendedCat = 'tenancy';
      recommendedLabel = 'Tenancy & Housing Law';
    } else if (query.includes('divorce') || query.includes('custody') || query.includes('marriage') || query.includes('family') || query.includes('wife') || query.includes('husband') || query.includes('alimony') || query.includes('child')) {
      recommendedCat = 'family';
      recommendedLabel = 'Family & Divorce Law';
    } else if (query.includes('criminal') || query.includes('theft') || query.includes('assault') || query.includes('police') || query.includes('arrest') || query.includes('bail') || query.includes('jail') || query.includes('robbery') || query.includes('court case')) {
      recommendedCat = 'criminal';
      recommendedLabel = 'Criminal Defense';
    } else if (query.includes('wage') || query.includes('salary') || query.includes('pay') || query.includes('freelance') || query.includes('invoice') || query.includes('boss') || query.includes('overtime') || query.includes('designer') || query.includes('contractor') || query.includes('job')) {
      recommendedCat = 'employment';
      recommendedLabel = 'Employment & Labor Law';
    } else if (query.includes('contract') || query.includes('nda') || query.includes('agreement') || query.includes('signing') || query.includes('intellectual') || query.includes('ip')) {
      recommendedCat = 'contract';
      recommendedLabel = 'Contracts & Freelance';
    } else if (query.includes('car') || query.includes('warranty') || query.includes('dealer') || query.includes('lemon') || query.includes('consumer') || query.includes('billing') || query.includes('scam') || query.includes('refund')) {
      recommendedCat = 'consumer';
      recommendedLabel = 'Consumer Protection';
    }

    if (recommendedCat !== 'all') {
      // Set recommendation text and show alert
      recCategoryName.textContent = recommendedLabel;
      searchRecommendationBox.style.display = 'flex';

      // Set filter specialty and render
      filterSpecialty.value = recommendedCat;
      renderLawyers();
    } else {
      searchRecommendationBox.style.display = 'none';
      alert('Could not determine a specific match. Showing all fields. Try searching with keywords like "divorce", "land dispute", or "unpaid pay".');
      filterSpecialty.value = 'all';
      renderLawyers();
    }
    lucide.createIcons();
  }

  btnSearchCases.addEventListener('click', executeCaseSearch);
  caseSearchBar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      executeCaseSearch();
    }
  });

  // ==================== BOOKING MODAL & WORKSPACE INITIALIZATION ====================
  function openBookingModal(lawyerId) {
    const lawyer = LAWYERS_DATABASE.find(l => l.id === lawyerId);
    if (!lawyer) return;

    state.selectedLawyer = lawyer;

    // Mini profile
    bookingLawyerMini.innerHTML = `
      <div class="avatar">${lawyer.avatarText}</div>
      <div class="mini-info">
        <h4>${lawyer.name}</h4>
        <span>${lawyer.specialtyLabel} • ${lawyer.barNumber}</span>
      </div>
    `;

    // Packages radio select
    modalPackagesContainer.innerHTML = '';
    lawyer.packages.forEach((pkg, index) => {
      const radioDiv = document.createElement('div');
      radioDiv.innerHTML = `
        <input type="radio" name="modal-package-select" id="pkg-rad-${index}" class="package-radio-input" value="${index}" ${index === 0 ? 'checked' : ''}>
        <label for="pkg-rad-${index}" class="package-radio-label">
          <div>
            <span class="pkg-name">${pkg.name}</span>
            <p style="font-size:10px; color:var(--text-muted); margin-top:2px;">${pkg.desc}</p>
          </div>
          <span class="pkg-cost">${pkg.price}</span>
        </label>
      `;
      modalPackagesContainer.appendChild(radioDiv);
    });

    // Date pre-set
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('booking-date').value = tomorrow.toISOString().substring(0, 10);

    bookingModal.style.display = 'flex';
  }

  btnCloseModal.addEventListener('click', () => {
    bookingModal.style.display = 'none';
  });

  // Close modal clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === bookingModal) {
      bookingModal.style.display = 'none';
    }
  });

  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const lawyer = state.selectedLawyer;
    const selectedRadioIndex = document.querySelector('input[name="modal-package-select"]:checked').value;
    const selectedPkg = lawyer.packages[selectedRadioIndex];
    const notes = document.getElementById('booking-notes').value.trim();
    const dateVal = document.getElementById('booking-date').value;
    const modeVal = document.querySelector('input[name="consult-mode"]:checked').value;
    const backupContact = document.getElementById('booking-contact-backup').value.trim();

    // Close Modal
    bookingModal.style.display = 'none';

    // Set Workspace variables
    state.isWorkspaceInitialized = true;
    state.workspaceData.lawyer = lawyer;
    state.workspaceData.caseCategory = lawyer.specialty;
    state.workspaceData.caseTitle = state.isCaseAnalyzed ? state.analyzedData.title : `${lawyer.specialtyLabel} Dispute`;
    state.workspaceData.pricing = {
      name: selectedPkg.name,
      price: selectedPkg.price,
      desc: selectedPkg.desc
    };

    // Load template timeline based on category
    let steps = [];
    if (lawyer.specialty === 'tenancy') {
      steps = [
        { label: `Initial Consultation (${modeVal})`, date: dateVal, status: 'active' },
        { label: 'Demand Letter Drafting', date: 'Scheduled', status: 'pending' },
        { label: 'Wait for Response (10 Days)', date: 'Pending', status: 'pending' },
        { label: 'Prepare Court Filings', date: 'Pending', status: 'pending' }
      ];
    } else if (lawyer.specialty === 'employment') {
      steps = [
        { label: `Consultation (${modeVal})`, date: dateVal, status: 'active' },
        { label: 'Contract Breach Notice', date: 'Scheduled', status: 'pending' },
        { label: 'Mediation & Labor Filing', date: 'Pending', status: 'pending' }
      ];
    } else if (lawyer.specialty === 'family') {
      steps = [
        { label: `Divorce Consultation (${modeVal})`, date: dateVal, status: 'active' },
        { label: 'Separation Agreement Review', date: 'Scheduled', status: 'pending' },
        { label: 'Family Court Petition', date: 'Pending', status: 'pending' }
      ];
    } else if (lawyer.specialty === 'criminal') {
      steps = [
        { label: `Defense Audit (${modeVal})`, date: dateVal, status: 'active' },
        { label: 'Police Discovery Request', date: 'Scheduled', status: 'pending' },
        { label: 'Bail & Charge Hearing', date: 'Pending', status: 'pending' }
      ];
    } else {
      steps = [
        { label: `Consultation (${modeVal})`, date: dateVal, status: 'active' },
        { label: 'Demand Packet Sent', date: 'Scheduled', status: 'pending' },
        { label: 'Settlement Negotiation', date: 'Pending', status: 'pending' }
      ];
    }

    wsRoadmapSteps.innerHTML = '';
    steps.forEach(step => {
      const stepDiv = document.createElement('div');
      stepDiv.className = `roadmap-step-item ${step.status}`;
      stepDiv.innerHTML = `
        <div class="roadmap-dot"></div>
        <span class="roadmap-text">${step.label}</span>
        <span class="roadmap-date">${step.date}</span>
      `;
      wsRoadmapSteps.appendChild(stepDiv);
    });

    // Populate Sidebar values
    wsLawyerAvatar.textContent = lawyer.avatarText;
    wsLawyerName.textContent = lawyer.name;
    wsLawyerRole.textContent = lawyer.specialtyLabel;
    wsPricingTag.textContent = selectedPkg.name;
    wsPricingPrice.textContent = selectedPkg.price;
    wsPricingDesc.textContent = selectedPkg.desc;

    // Reset Chat Messages
    chatMessagesBox.innerHTML = '';
    
    // Add Welcome messages (simulated conversation flow)
    const welcomeMsg1 = `Hello! I'm ${lawyer.name}. I've successfully received your consultation request. Let's schedule our **${modeVal}** consultation on **${dateVal}**.`;
    const welcomeMsg2 = `I have reviewed your case description summary: <br><em>"${notes}"</em>.<br>In case of any date changes, I have saved your backup contact detail: <strong>${backupContact}</strong>.`;
    
    appendChatMessage('received', welcomeMsg1, lawyer.avatarText);
    
    setTimeout(() => {
      appendChatMessage('received', welcomeMsg2, lawyer.avatarText);
    }, 600);

    setTimeout(() => {
      let welcomeMsg3 = '';
      if (modeVal === 'Online') {
        welcomeMsg3 = `For our **Online video consultation**, I'll send a secure meeting URL to this thread. Please upload any contracts, agreements, or pictures in the right sidebar uploader beforehand so I can audit them.`;
      } else {
        welcomeMsg3 = `For our **In-Office consultation**, please note my coordinates. It's best if you upload files (lease, contract) here on the right beforehand, so we can run our AI compliance scanner and save time in person!`;
      }
      appendChatMessage('received', welcomeMsg3, lawyer.avatarText);
    }, 1200);

    // Set initial file counts
    wsDocsCount.textContent = '0';
    uploadedFilesList.innerHTML = `
      <div class="file-list-item" style="border-style: dashed; background: transparent; justify-content: center; color: var(--text-muted); opacity: 0.7;">
        No documents uploaded yet
      </div>
    `;

    // Swap workspace containers
    workspaceEmptyContainer.style.display = 'none';
    workspaceActiveContainer.style.display = 'grid';

    // Show navigation badge alert
    workspaceBadge.style.display = 'inline-block';

    // Go to workspace tab
    switchTab('workspace');
  });

  // Quickstart Demo Workspace
  btnWorkspaceQuickstart.addEventListener('click', () => {
    // Select Sarah Jenkins and Tenancy package
    state.selectedLawyer = LAWYERS_DATABASE[0];
    const mockFormSubmitEvent = new Event('submit');
    
    // Populate fake selection
    state.isWorkspaceInitialized = true;
    state.workspaceData.lawyer = LAWYERS_DATABASE[0];
    state.workspaceData.caseCategory = 'tenancy';
    state.workspaceData.caseTitle = 'Security Deposit Recovery Dispute';
    state.workspaceData.pricing = {
      name: 'Small Claims Prep',
      price: '$450',
      desc: 'Full evidence compilation, witness sheets, and courtroom rehearsal.'
    };

    // Load steps
    const steps = [
      { label: 'Demand Letter Sent', date: 'Completed Jun 24', status: 'complete' },
      { label: 'Await Landlord Response', date: 'Late (Due Jun 29)', status: 'active' },
      { label: 'Assemble Small Claims Suit', date: 'Scheduled', status: 'pending' },
      { label: 'Simulate Court Trial', date: 'Pending', status: 'pending' }
    ];

    wsRoadmapSteps.innerHTML = '';
    steps.forEach(step => {
      const stepDiv = document.createElement('div');
      stepDiv.className = `roadmap-step-item ${step.status}`;
      stepDiv.innerHTML = `
        <div class="roadmap-dot"></div>
        <span class="roadmap-text">${step.label}</span>
        <span class="roadmap-date">${step.date}</span>
      `;
      wsRoadmapSteps.appendChild(stepDiv);
    });

    // Populate Sidebar values
    wsLawyerAvatar.textContent = 'SJ';
    wsLawyerName.textContent = 'Sarah Jenkins, Esq.';
    wsLawyerRole.textContent = 'Tenancy Specialist';
    wsPricingTag.textContent = 'Small Claims Prep';
    wsPricingPrice.textContent = '$450';
    wsPricingDesc.textContent = 'Full evidence compilation, witness sheets, and courtroom rehearsal.';

    // Reset Chat Messages
    chatMessagesBox.innerHTML = '';
    
    // Injected conversation
    appendChatMessage('received', "Hello! I reviewed the photos of the cabinet scratches you uploaded. Those are clearly normal wear and tear under local laws. Let's send the formal demand notice tomorrow. Do you have the landlord's mailing address?", 'SJ');
    appendChatMessage('sent', "Yes, I just added it to the files. It's written at the bottom of page 12 on the lease.", 'ME');
    appendChatMessage('received', "Excellent. I uploaded a copy of the lease agreement here as well. Can you click the 'Scan File' button next to the Lease Agreement PDF on the right sidebar? Let's check if there are other illegal clauses that we should cite to pressure them.", 'SJ');

    // Load mock documents in sidebar
    wsDocsCount.textContent = '1';
    uploadedFilesList.innerHTML = `
      <div class="file-list-item" id="mock-file-lease-item">
        <div class="file-info">
          <i data-lucide="file-text"></i>
          <div class="file-meta-text">
            <span class="file-name">LeaseAgreement.pdf</span>
            <span class="file-size">1.8 MB • Added Jun 25</span>
          </div>
        </div>
        <div class="file-actions">
          <button class="btn-file-scan" data-doc="lease">Scan File</button>
        </div>
      </div>
    `;

    // Swap workspace containers
    workspaceEmptyContainer.style.display = 'none';
    workspaceActiveContainer.style.display = 'grid';

    // Hook scanning buttons
    const scanBtn = uploadedFilesList.querySelector('.btn-file-scan');
    scanBtn.addEventListener('click', () => {
      triggerDocumentAudit('lease');
    });

    // Go to workspace tab
    switchTab('workspace');
    lucide.createIcons();
  });

  // ==================== MESSAGING WORKSPACE SIMULATION ====================
  function appendChatMessage(sender, text, avatar) {
    const msgWrapper = document.createElement('div');
    msgWrapper.className = `msg-wrapper ${sender}`;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    msgWrapper.innerHTML = `
      <div class="msg-bubble">
        ${text}
      </div>
      <span class="msg-timestamp">${time}</span>
    `;

    chatMessagesBox.appendChild(msgWrapper);
    
    // Auto-scroll chat box
    chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
  }

  chatInputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatMessageInput.value.trim();
    if (!text) return;

    // Send user message
    appendChatMessage('sent', text, 'ME');
    chatMessageInput.value = '';

    // Create lawyer reply trigger
    const advocateText = state.workspaceData.lawyer ? state.workspaceData.lawyer.avatarText : 'SJ';
    
    // Simulate "typing..." element
    const typingBubble = document.createElement('div');
    typingBubble.className = 'msg-wrapper received typing-msg';
    typingBubble.innerHTML = `
      <div class="msg-bubble" style="padding: 10px 14px; opacity: 0.6;">
        <span style="font-style: italic;">Advocate typing...</span>
      </div>
    `;
    chatMessagesBox.appendChild(typingBubble);
    chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;

    setTimeout(() => {
      // Remove typing bubble
      typingBubble.remove();

      // Core reply routing
      let matchedResponse = "I hear you. Let me check our evidence files. Feel free to upload any screenshots or invoices so I can verify details.";
      const query = text.toLowerCase();

      for (let item of MOCK_CHAT_ANSWERS) {
        if (item.keywords.some(kw => query.includes(kw))) {
          matchedResponse = item.response;
          break;
        }
      }

      appendChatMessage('received', matchedResponse, advocateText);
    }, 1200);
  });

  // ==================== SECURE FILES & CLAUSE AUDITOR ====================
  // Mock file picker clicks
  mockDocBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const docType = btn.getAttribute('data-doc');
      addMockFileToWorkspace(docType);
    });
  });

  // Drag over dropzone
  docUploadDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    docUploadDropzone.classList.add('dragover');
  });

  docUploadDropzone.addEventListener('dragleave', () => {
    docUploadDropzone.classList.remove('dragover');
  });

  docUploadDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    docUploadDropzone.classList.remove('dragover');
    
    // Simulate random file upload
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const randomFile = files[0];
      const isLease = randomFile.name.toLowerCase().includes('lease') || randomFile.name.toLowerCase().includes('rental');
      const docType = isLease ? 'lease' : 'freelance';
      addMockFileToWorkspace(docType);
    }
  });

  function addMockFileToWorkspace(docType) {
    const data = MOCK_CONTRACT_AUDITS[docType];
    if (!data) return;

    // Check if file already added
    const existing = document.getElementById(`mock-file-${docType}-item`);
    if (existing) {
      alert(`Document "${data.fileName}" is already in your workspace.`);
      return;
    }

    // Remove empty placeholder if first file
    const docItems = uploadedFilesList.querySelectorAll('.file-list-item');
    if (docItems.length === 1 && docItems[0].textContent.includes('No documents')) {
      uploadedFilesList.innerHTML = '';
    }

    const fileDiv = document.createElement('div');
    fileDiv.className = 'file-list-item';
    fileDiv.id = `mock-file-${docType}-item`;
    fileDiv.innerHTML = `
      <div class="file-info">
        <i data-lucide="file-text"></i>
        <div class="file-meta-text">
          <span class="file-name">${data.fileName}</span>
          <span class="file-size">${data.fileSize} • Added just now</span>
        </div>
      </div>
      <div class="file-actions">
        <button class="btn-file-scan" data-doc="${docType}">Scan File</button>
      </div>
    `;

    uploadedFilesList.appendChild(fileDiv);
    
    // Update count
    const totalCount = uploadedFilesList.querySelectorAll('.file-list-item').length;
    wsDocsCount.textContent = totalCount;

    // Add scan listener
    const scanBtn = fileDiv.querySelector('.btn-file-scan');
    scanBtn.addEventListener('click', () => {
      triggerDocumentAudit(docType);
    });

    lucide.createIcons();

    // Trigger advocate comment in chat
    setTimeout(() => {
      const lawyer = state.workspaceData.lawyer ? state.workspaceData.lawyer.avatarText : 'SJ';
      appendChatMessage('received', `I noticed you uploaded ${data.fileName}. Please click the "Scan File" button next to it. It will highlight standard violations and suggest redlines instantly.`, lawyer);
    }, 1000);
  }

  function triggerDocumentAudit(docType) {
    const data = MOCK_CONTRACT_AUDITS[docType];
    if (!data) return;

    // Update uploader area to show scanning state
    const originalText = docUploadDropzone.innerHTML;
    docUploadDropzone.innerHTML = `
      <div class="loading-ring" style="width:36px; height:36px; border-width:3px; margin:0 auto 10px;"></div>
      <p style="font-size:12px; font-weight:700;">Auditing clauses for state compliance...</p>
    `;

    setTimeout(() => {
      // Revert dropzone text
      docUploadDropzone.innerHTML = originalText;
      lucide.createIcons();

      // Show Auditor Panel
      auditFileName.textContent = data.fileName;
      auditScore.textContent = data.score;
      
      // Select badge styling
      if (docType === 'lease') {
        auditScore.className = 'pill-tag text-rose';
      } else {
        auditScore.className = 'pill-tag text-amber';
      }

      // Populate clauses
      auditClausesBox.innerHTML = '';
      data.clauses.forEach((clause, index) => {
        const clauseDiv = document.createElement('div');
        clauseDiv.className = 'audit-clause-card';
        clauseDiv.style.borderLeftColor = clause.severity === 'warning' ? 'var(--accent-rose)' : 'var(--accent-amber)';
        clauseDiv.innerHTML = `
          <div class="clause-header">
            <span class="clause-num">${clause.num}</span>
            <span class="clause-severity ${clause.severity}">${clause.severityText}</span>
          </div>
          <div class="original-clause-text">${clause.original}</div>
          <div class="clause-explanation"><strong>Analysis:</strong> ${clause.explanation}</div>
          <div class="clause-remedy"><strong>Fix Code:</strong> ${clause.remedy}</div>
        `;
        auditClausesBox.appendChild(clauseDiv);
      });

      clauseAuditorContainer.style.display = 'block';

      // Push advocate text in chat
      setTimeout(() => {
        const lawyer = state.workspaceData.lawyer ? state.workspaceData.lawyer.avatarText : 'SJ';
        if (docType === 'lease') {
          appendChatMessage('received', "Wow. The auditor flagged the late fees and entry clauses. They are illegal under our civil code. I'll include citations for these in the demand draft. That gives us massive leverage.", lawyer);
        } else {
          appendChatMessage('received', "The IP transfer clause is highly predatory. They are asking for full ownership without paying you. We must demand changing Section 4(a) to link IP transfer to invoice clearance.", lawyer);
        }
      }, 800);

    }, 1500);
  }

  btnCloseAudit.addEventListener('click', () => {
    clauseAuditorContainer.style.display = 'none';
  });

  // ==================== FAQ ACCORDION LOGIC ====================
  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const item = question.parentElement;
      const isOpen = item.classList.contains('open');
      
      // Close all first
      document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('open');
      });

      // Toggle current
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });

  // ==================== CLAUDE API AUDITOR & SEMANTIC FALLBACK ====================
  async function checkPlausibilityWithClaude(lawyer, queryText) {
    const apiKey = localStorage.getItem('ANTHROPIC_API_KEY') || '';
    
    if (apiKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'dangerously-allow-browser': 'true'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            system: 'You are a legal matching auditor. Compare the user\'s legal dispute description with the advocate\'s verified cases. Return ONLY a JSON object: { "plausible_match": boolean, "explanation": "one sentence explaining why it is or is not a match" }.',
            messages: [
              {
                role: 'user',
                content: `Advocate cases: ${JSON.stringify(lawyer.verified_cases)}\nUser dispute: "${queryText}"`
              }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const textResponse = data.content[0].text;
          const parsed = JSON.parse(textResponse.trim());
          return parsed;
        }
      } catch (e) {
        console.error('Claude API call failed, falling back to local analysis:', e);
      }
    }

    // Mock API Fallback Algorithm (keyword matching)
    await new Promise(resolve => setTimeout(resolve, 800));

    const q = queryText.toLowerCase();
    
    // Check keywords overlap
    let match = false;
    let matchCount = 0;
    let matchedKeywords = [];

    const specialtyKeywords = {
      tenancy: ['landlord', 'tenant', 'deposit', 'rent', 'lease', 'evict', 'eviction', 'roommate', 'apartment', 'housing', 'mold', 'repair', 'habitability'],
      employment: ['wage', 'salary', 'invoice', 'unpaid', 'pay', 'overtime', 'freelance', 'contractor', 'boss', 'designer', 'work', 'job', 'severance'],
      contract: ['contract', 'nda', 'agreement', 'signing', 'clause', 'ip', 'breach', 'non-compete', 'shareholder'],
      consumer: ['car', 'warranty', 'dealer', 'lemon', 'purchase', 'bill', 'billing', 'scam', 'credit', 'reporting', 'refund'],
      criminal: ['theft', 'dui', 'police', 'arrest', 'bail', 'jail', 'warrant', 'charge', 'misdemeanor', 'citation', 'speeding'],
      family: ['divorce', 'custody', 'marriage', 'alimony', 'child', 'separation', 'marital', 'asset', 'family']
    };

    const targetKeywords = specialtyKeywords[lawyer.specialty] || [];
    targetKeywords.forEach(kw => {
      if (q.includes(kw)) {
        matchCount++;
        matchedKeywords.push(kw);
      }
    });

    if (matchCount >= 1) {
      match = true;
    }

    if (match) {
      return {
        plausible_match: true,
        explanation: `Plausible Match: Handles similar issues. Matched keywords: ${matchedKeywords.join(', ')}. Advocate has successfully resolved ${lawyer.verified_cases[0].case_type} in District Court.`
      };
    } else {
      return {
        plausible_match: false,
        explanation: `Low Plausibility: No keyword overlap found. This advocate's verified track record is focused primarily on ${lawyer.specialtyLabel}.`
      };
    }
  }

  // Pre-load default lawyers on start
  renderLawyers();
});
