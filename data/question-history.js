// Shared form definitions keep submitted answers paired with their original questions.
window.BISHOP_QUESTIONS_V1=[
  {id:'intention',title:role=>`Do you wish to continue serving as a ${role} for the coming year?`,help:'If you intend to resign, select that option. D.R.O.G.S will contact you privately.',type:'choice',options:['I wish to continue','I wish to resign','I need to discuss my position']},
  {id:'standing',title:()=>`How would you describe your present standing and readiness for this office?`,help:'Use the scale as an honest personal reflection. It is not an automatic score.',type:'scale'},
  {id:'oversight',title:()=>`Are you actively overseeing and caring for the people, ministry and leaders entrusted to you?`,help:'Consider supervision, pastoral care, standards, training and timely support.',type:'choice',options:['Yes, consistently','Partly — I need support','No']},
  {id:'doctrine',title:()=>`Are you in agreement with the church’s statement of faith, aims, vision and governing direction?`,help:'Please disclose any area that requires clarification.',type:'choice',options:['Yes','I need clarification','No']},
  {id:'training',title:()=>`Have you intentionally trained and developed leaders or successors during this annual cycle?`,help:'Ministry includes producing and strengthening other leaders.',type:'choice',options:['Yes, consistently','Somewhat','Not during this period']},
  {id:'councils',title:()=>`Have you worked faithfully through the appropriate councils and implemented their decisions?`,help:'This includes participation, accountability and follow-through.',type:'choice',options:['Yes','Mostly','I need to discuss this']},
  {id:'communication',title:()=>`Are you maintaining open communication, unity and healthy relationships with leaders above and below you?`,help:'Include any isolation, unresolved conflict or relationship requiring help in your disclosure.',type:'choice',options:['Yes','Some areas need attention','No']},
  {id:'stewardship',title:()=>`Are the administration, reporting, finances and property under your care handled responsibly?`,help:'This includes compliance with church procedures and applicable laws.',type:'choice',options:['Yes','There are matters to resolve','No']},
  {id:'integrity',title:()=>`Is there any matter of conduct, marriage, finance, authority or personal integrity that requires confidential review?`,help:'A request for help is treated as a disclosure for authorized review, not as an automatic decision.',type:'choice',options:['No matter to disclose','Yes — I request a confidential review']},
  {id:'commitment',title:()=>`Will you uphold the obligations of this office, including confidentiality, accountability and responsible leadership?`,help:'Your annual declaration confirms the information supplied in this submission.',type:'choice',options:['Yes, I recommit','I need to discuss this before recommitting']}
];

window.BISHOP_QUESTIONS_V1.push(window.BISHOP_QUESTIONS_V1.shift());

// Adapted from The Gift of Governments, second edition (2022), chapters 9–10.
// Distinct IDs prevent answers to the previous governance form being relabelled.

window.PASTOR_QUESTIONS_V1=[
 {id:'pastorCalling',title:'Do you still believe you are called to pastoral ministry, and how would you describe your spiritual life at present?',help:'Describe your present conviction and any area where you would welcome support.',type:'text',source:'Chapter 9: pastoral qualifications, point 1; checklist A'},
 {id:'pastorTraining',title:'What pastoral training, camps or ministry examinations have you completed during the past year?',help:'You may write “None this year” and explain your circumstances.',type:'text',source:'Chapter 9: training programme; checklist D and H'},
 {id:'pastorResponsibilities',title:'What ministry responsibilities are you currently carrying out, and what progress have you made during the past year?',help:'Include your current assignment and a brief example of the work you have done.',type:'text',source:'Chapter 9: checklist C'},
 {id:'pastorPrayer',title:'On a typical day, how much time do you devote to personal prayer?',help:'Choose the answer that best describes your current practice.',type:'choice',options:['Less than 1 hour','1 hour to under 2 hours','2 hours to under 3 hours','3 hours or more'],source:'Chapter 10: duty 1'},
 {id:'pastorCare',title:'How regularly do you visit, follow up and care for the people entrusted to you?',help:'Consider personal contact, pastoral visits and support for people in need.',type:'choice',options:['Weekly','Monthly','Occasionally','Not currently'],source:'Chapter 10: duties 2, 4 and 9'},
 {id:'pastorTeaching',title:'How regularly are you preaching, teaching or counselling, and where do you need further support?',help:'Describe your current involvement and any training or support that would help.',type:'text',source:'Chapter 10: duty 3; Chapter 9: checklist H'},
 {id:'pastorParticipation',title:'Have you consistently participated in the services, leadership meetings and church programmes required of your role?',help:'You can explain any difficulty or absence in the optional confidential note below.',type:'choice',options:['Consistently','Sometimes','Rarely','Not currently'],source:'Chapter 10: duties 5, 7 and 8; Chapter 9: checklist F'},
 {id:'pastorConduct',title:'Is there any unresolved matter concerning your conduct, honesty, relationships or handling of money that you need to discuss privately with church leadership?',help:'You may request a private conversation without writing the details here.',type:'choice',options:['No','Yes','I would prefer a private conversation'],source:'Chapter 9: pastoral qualifications and checklist A'},
 {id:'pastorAccountability',title:'Are you maintaining regular communication and accountability with your supervising bishop or pastor?',help:'Consider your current contact, feedback and any matter that needs attention.',type:'choice',options:['Yes, regularly','Sometimes — I need support','Not currently'],source:'Chapter 10: duty 6; Chapter 9: checklist I'},
 {id:'intention',title:'Do you wish to continue serving as a pastor for the coming year?',help:'If you wish to resign, your response will go to D.R.O.G.S for review. You will not be taken to payment.',type:'choice',options:['I wish to continue','I wish to resign','I need to discuss my position'],source:'Adaptation of willing service in Chapter 10, opening passage (1 Peter 5:2–3)'}
];

// Original governance v2 submissions retain their question wording and order.
window.BISHOP_QUESTIONS_V2=[
 {id:'bishopPastorCount',title:'How many pastors are currently under your oversight?',type:'number',help:'Enter the current number of pastors.'},
 {id:'bishopChurchCount',title:'How many churches are under your jurisdiction?',type:'number',help:'Enter the current number of churches.'},
 {id:'doctrine',title:'Are you in agreement with the church’s statement of faith, aims, vision and governing direction?',help:'Please disclose any area that requires clarification.',type:'choice',options:['Yes','I need clarification','No']},
 {id:'training',title:'Have you intentionally trained and developed leaders or successors during this annual cycle?',help:'Ministry includes producing and strengthening other leaders.',type:'choice',options:['Yes, consistently','Somewhat','Not during this period']},
 {id:'bishopPastorsContacted',title:'How many pastors did you personally communicate with or visit during the past year?',type:'number',help:'Count each pastor once, even if you contacted or visited them several times.'},
 {id:'bishopJurisdictionChallenges',title:'What are the three greatest challenges within your jurisdiction?',type:'text',help:'Describe the challenges and where support would be most useful.'},
 {id:'stewardship',title:'Are the administration, reporting, finances and property under your care handled responsibly?',help:'This includes compliance with church procedures and applicable laws.',type:'choice',options:['Yes','There are matters to resolve','No']},
 {id:'integrity',title:'Is there any matter of conduct, marriage, finance, authority or personal integrity that requires confidential review?',help:'You may request a private conversation without writing the details here.',type:'choice',options:['No matter to disclose','Yes — I request a confidential review']},
 {id:'commitment',title:'Will you uphold the obligations of this office, including confidentiality, accountability and responsible leadership?',help:'Your annual declaration confirms the information supplied in this submission.',type:'choice',options:['Yes, I recommit','I need to discuss this before recommitting']},
 {id:'intention',title:'Do you wish to continue serving as a leader for the coming year?',help:'If you intend to resign, select that option. D.R.O.G.S will contact you privately.',type:'choice',options:['I wish to continue','I wish to resign','I need to discuss my position']}
];
