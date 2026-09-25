window.PASTOR_QUESTION_SET='pastor-2027-v4';
window.PASTOR_QUESTIONS=[
 {
  "id": "pastorBeliefs",
  "title": "Do you continue to agree with and uphold the doctrine, beliefs and values of our ministry?",
  "type": "choice",
  "options": [
   "Yes",
   "Partly / sometimes",
   "No"
  ],
  "review": {
   "clear": [
    "Yes"
   ],
   "middle": [],
   "flag": [
    "Partly / sometimes",
    "No"
   ],
   "reason": "Agreement with ministry doctrine needs review."
  },
  "followUps": [
   {
    "id": "pastorBeliefsExplanation",
    "label": "Optional: explain any reservations or questions.",
    "type": "text",
    "reviewNote": true
   }
  ]
 },
 {
  "id": "faithAndPrayer",
  "title": "How are your faith, prayer life and desire to serve in ministry?",
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
  "help": "Consider whether prayer has become difficult, your faith feels unsettled, or your interest in ministry has declined.",
  "followUps": [
   {
    "id": "faithDetails",
    "label": "Optional: tell us more about what you have noticed.",
    "type": "text",
    "reviewNote": true
   }
  ]
 },
 {
  "id": "pastorGoodStanding",
  "title": "Are you endeavoring to maintain biblical standards of holiness and integrity?",
  "type": "choice",
  "options": [
   "Yes",
   "Partly / sometimes",
   "No"
  ],
  "review": {
   "clear": [
    "Yes"
   ],
   "middle": [],
   "flag": [
    "Partly / sometimes",
    "No"
   ],
   "reason": "Personal standing needs review."
  },
  "help": "Answer honestly so leadership can offer appropriate support. The questions below concern the past year. You may request a private conversation instead of writing sensitive details.",
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
   }
  ]
 },
 {
  "id": "pastorActiveMinistry",
  "title": "Are you currently actively involved in ministry?",
  "type": "choice",
  "options": [
   "Yes",
   "Partly / sometimes",
   "No",
   "None"
  ],
  "review": {
   "clear": [
    "Yes"
   ],
   "middle": [
    "Partly / sometimes"
   ],
   "flag": [
    "No",
    "None"
   ],
   "reason": "This answer needs a conversation with leadership."
  }
 },
 {
  "id": "pastorMinistryConnection",
  "title": "Have you remained connected to ministry meetings, conferences, training and activities where reasonably possible?",
  "type": "choice",
  "options": [
   "Yes",
   "Partly / sometimes",
   "No"
  ],
  "review": {
   "clear": [
    "Yes"
   ],
   "middle": [
    "Partly / sometimes"
   ],
   "flag": [
    "No"
   ],
   "reason": "This answer needs a conversation with leadership."
  }
 },
 {
  "id": "healthImpact",
  "title": "Has your physical or emotional health affected your ability to carry out your ministry?",
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
  "help": "Consider missed services, reduced capacity, exhaustion or ongoing health difficulties. You do not need to provide a diagnosis.",
  "followUps": [
   {
    "id": "healthDetails",
    "label": "Optional: explain the effect on your ministry and any support you would welcome.",
    "type": "text",
    "reviewNote": true
   }
  ]
 },
 {
  "id": "pastorVisionSupport",
  "title": "Do you commit to supporting the vision and work of the ministry during the coming year?",
  "type": "choice",
  "options": [
   "Yes",
   "Partly / sometimes",
   "No"
  ],
  "review": {
   "clear": [
    "Yes"
   ],
   "middle": [],
   "flag": [
    "Partly / sometimes",
    "No"
   ],
   "reason": "Commitment to the ministry vision needs review."
  }
 },
 {
  "id": "pastorAnnualCommitment",
  "title": "Do you commit to supporting the ministry through your Annual Ministerial Commitment?",
  "type": "choice",
  "options": [
   "Yes",
   "Partly / sometimes",
   "No"
  ],
  "review": {
   "clear": [
    "Yes"
   ],
   "middle": [
    "Partly / sometimes"
   ],
   "flag": [
    "No"
   ],
   "reason": "This answer needs a conversation with leadership."
  },
  "followUps": [
   {
    "id": "pastorPaymentPreference",
    "label": "Preferred payment",
    "type": "choice",
    "options": [
     "Annual",
     "Monthly"
    ]
   }
  ]
 },
 {
  "id": "pastorLeadershipDisclosure",
  "title": "Is there anything in your ministry, marriage, personal circumstances or relationship with the organization that you would like to discuss?",
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
  "followUps": [
   {
    "id": "pastorLeadershipExplanation",
    "label": "Optional: explain what you would like leadership to know.",
    "type": "text",
    "reviewNote": true
   }
  ]
 },
 {
  "id": "intention",
  "title": "Do you reaffirm your calling and wish to renew your standing in ministry for the coming year?",
  "type": "choice",
  "options": [
   {
    "value": "I wish to continue",
    "label": "Yes, I renew my commitment"
   },
   {
    "value": "I need to discuss my position",
    "label": "I would like to discuss my position"
   },
   {
    "value": "I wish to resign",
    "label": "No, I wish to resign"
   }
  ],
  "review": {
   "clear": [
    "I wish to continue"
   ],
   "middle": [],
   "flag": [
    "I need to discuss my position",
    "I wish to resign"
   ],
   "reason": "Renewal decision needs individual attention."
  }
 }
];
