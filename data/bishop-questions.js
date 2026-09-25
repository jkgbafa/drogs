window.BISHOP_QUESTION_SET='governance-2027-v4';
window.BISHOP_QUESTIONS=[
 {
  "id": "bishopPastorCount",
  "title": "How many pastors are currently under your oversight?",
  "type": "number",
  "help": "Enter the current number of pastors."
 },
 {
  "id": "bishopChurchCount",
  "title": "How many churches are under your jurisdiction?",
  "type": "number",
  "help": "Enter the current number of churches."
 },
 {
  "id": "bishopPastorsContacted",
  "title": "How many pastors did you personally communicate with or visit during the past year?",
  "type": "number",
  "help": "Count each pastor once, even if you contacted or visited them several times."
 },
 {
  "id": "training",
  "title": "Have you intentionally trained and developed leaders or successors during this annual cycle?",
  "help": "Ministry includes producing and strengthening other leaders.",
  "type": "choice",
  "options": [
   "Yes, consistently",
   "Somewhat",
   "Not during this period"
  ],
  "review": {
   "clear": [
    "Yes, consistently"
   ],
   "middle": [
    "Somewhat"
   ],
   "flag": [
    "Not during this period"
   ],
   "reason": "Leadership development needs review."
  }
 },
 {
  "id": "bishopIntervention",
  "title": "Do any churches or pastors under your care presently require intervention or assistance?",
  "type": "choice",
  "options": [
   "No",
   "Yes",
   "I prefer to discuss privately"
  ],
  "review": {
   "clear": [
    "No"
   ],
   "flag": [
    "Yes",
    "I prefer to discuss privately"
   ],
   "reason": "Intervention or assistance requested."
  },
  "followUps": [
   {
    "id": "bishopInterventionDetails",
    "label": "Which churches or pastors need help, and what support is needed?",
    "type": "text",
    "reviewNote": true
   }
  ]
 },
 {
  "id": "bishopJurisdictionChallenges",
  "title": "What are the three greatest challenges within your jurisdiction?",
  "type": "text",
  "help": "Describe the challenges and where support would be most useful."
 },
 {
  "id": "bishopLeadershipMeetings",
  "title": "Did you hold leadership meetings with your pastors?",
  "type": "choice",
  "options": [
   "Yes",
   "Occasionally",
   "No"
  ],
  "followUps": [
   {
    "id": "bishopLeadershipMeetingsDetails",
    "label": "How often did you meet, and what were the main outcomes?",
    "type": "text",
    "when": "Yes"
   }
  ],
  "review": {
   "clear": [
    "Yes"
   ],
   "middle": [
    "Occasionally"
   ],
   "flag": [
    "No"
   ],
   "reason": "Leadership meetings need review."
  }
 },
 {
  "id": "integrity",
  "title": "Is there any matter of conduct, marriage, finance, authority or personal integrity that requires confidential review?",
  "help": "You may request a private conversation without writing the details here.",
  "type": "choice",
  "options": [
   "No matter to disclose",
   "Yes — I request a confidential review",
   "I prefer to discuss privately"
  ],
  "review": {
   "clear": [
    "No matter to disclose"
   ],
   "flag": [
    "Yes — I request a confidential review",
    "I prefer to discuss privately"
   ],
   "reason": "Confidential review requested."
  },
  "followUps": [
   {
    "id": "personalSins",
    "type": "choice",
    "options": [
     "No",
     "Occasionally / a little",
     "Yes",
     "I prefer to discuss privately"
    ],
    "review": {
     "clear": [
      "No"
     ],
     "middle": [],
     "flag": [
      "Occasionally / a little",
      "Yes",
      "I prefer to discuss privately"
     ],
     "reason": "Personal support or confidential review requested."
    },
    "label": "Are there personal sins or recurring habits you are struggling with or praying about?"
   },
   {
    "id": "masturbation",
    "type": "choice",
    "options": [
     "No",
     "Occasionally / a little",
     "Yes",
     "I prefer to discuss privately"
    ],
    "review": {
     "clear": [
      "No"
     ],
     "middle": [],
     "flag": [
      "Occasionally / a little",
      "Yes",
      "I prefer to discuss privately"
     ],
     "reason": "Personal support or confidential review requested."
    },
    "label": "Have you struggled with masturbation during the past year?"
   },
   {
    "id": "pornography",
    "type": "choice",
    "options": [
     "No",
     "Occasionally / a little",
     "Yes",
     "I prefer to discuss privately"
    ],
    "review": {
     "clear": [
      "No"
     ],
     "middle": [],
     "flag": [
      "Occasionally / a little",
      "Yes",
      "I prefer to discuss privately"
     ],
     "reason": "Personal support or confidential review requested."
    },
    "label": "Have you watched pornography during the past year?"
   },
   {
    "id": "sexOutsideMarriage",
    "type": "choice",
    "options": [
     "No",
     "Occasionally / a little",
     "Yes",
     "I prefer to discuss privately"
    ],
    "review": {
     "clear": [
      "No"
     ],
     "middle": [],
     "flag": [
      "Occasionally / a little",
      "Yes",
      "I prefer to discuss privately"
     ],
     "reason": "Personal support or confidential review requested."
    },
    "label": "Have you been sexually involved with anyone outside marriage during the past year?"
   },
   {
    "id": "sexualConductMember",
    "type": "choice",
    "options": [
     "No",
     "Occasionally / a little",
     "Yes",
     "I prefer to discuss privately"
    ],
    "review": {
     "clear": [
      "No"
     ],
     "middle": [],
     "flag": [
      "Occasionally / a little",
      "Yes",
      "I prefer to discuss privately"
     ],
     "reason": "Personal support or confidential review requested."
    },
    "label": "Have you been sexually involved with a church member other than your spouse during the past year?"
   },
   {
    "id": "otherConduct",
    "type": "choice",
    "options": [
     "No",
     "Occasionally / a little",
     "Yes",
     "I prefer to discuss privately"
    ],
    "review": {
     "clear": [
      "No"
     ],
     "middle": [],
     "flag": [
      "Occasionally / a little",
      "Yes",
      "I prefer to discuss privately"
     ],
     "reason": "Personal support or confidential review requested."
    },
    "label": "Have dishonesty, misuse of money or authority, substance use, or uncontrolled anger affected your ministry?"
   },
   {
    "id": "personalSupportDetails",
    "label": "Optional: tell us what support you need. You may keep the details for a private conversation.",
    "type": "text",
    "reviewNote": true
   },
   {
    "id": "healthImpact",
    "type": "choice",
    "options": [
     "No impact",
     "Some impact — I have struggled or missed some duties",
     "Significant impact — I need support",
     "I prefer to discuss privately"
    ],
    "review": {
     "clear": [
      "No impact"
     ],
     "middle": [],
     "flag": [
      "Some impact — I have struggled or missed some duties",
      "Significant impact — I need support",
      "I prefer to discuss privately"
     ],
     "reason": "Health-related support needs review."
    },
    "label": "Has your physical or emotional health affected your ability to carry out your ministry?"
   },
   {
    "id": "healthDetails",
    "label": "Optional: explain the effect on your ministry and any support you would welcome.",
    "type": "text",
    "reviewNote": true
   },
   {
    "id": "faithAndPrayer",
    "type": "choice",
    "options": [
     "Steady and engaged",
     "I have noticed some struggles",
     "I am struggling and would welcome support",
     "I prefer to discuss privately"
    ],
    "review": {
     "clear": [
      "Steady and engaged"
     ],
     "middle": [],
     "flag": [
      "I have noticed some struggles",
      "I am struggling and would welcome support",
      "I prefer to discuss privately"
     ],
     "reason": "Faith or prayer-life support requested."
    },
    "label": "How are your faith, prayer life and desire to serve in ministry?"
   },
   {
    "id": "faithDetails",
    "label": "Optional: tell us more about what you have noticed.",
    "type": "text",
    "reviewNote": true
   }
  ]
 },
 {
  "id": "bishopGrowthTarget",
  "title": "What is your growth target for the coming year?",
  "type": "text",
  "help": "Describe your targets and the practical steps you plan to take."
 },
 {
  "id": "intention",
  "title": "Do you wish to continue serving as a leader for the coming year?",
  "help": "If you intend to resign, select that option. DROGS will contact you privately.",
  "type": "choice",
  "options": [
   "I wish to continue",
   "I wish to resign",
   "I need to discuss my position"
  ],
  "review": {
   "clear": [
    "I wish to continue"
   ],
   "flag": [
    "I wish to resign",
    "I need to discuss my position"
   ],
   "reason": "Renewal decision needs individual attention."
  },
  "followUps": [
   {
    "id": "bishopDoctrine",
    "label": "Do you agree with and uphold the doctrine, beliefs and vision of our ministry?",
    "type": "choice",
    "options": [
     "Yes",
     "I have reservations",
     "No"
    ],
    "review": {
     "clear": [
      "Yes"
     ],
     "flag": [
      "I have reservations",
      "No"
     ],
     "reason": "Agreement with doctrine and vision needs review."
    }
   }
  ]
 }
];
