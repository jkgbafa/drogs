// Distinct version retains the original wording for submitted declarations.
window.BISHOP_QUESTION_SET='governance-2027-v3';
window.BISHOP_QUESTIONS=[
 {id:'bishopPastorCount',title:'How many pastors are currently under your oversight?',type:'number',help:'Enter the current number of pastors.'},
 {id:'bishopChurchCount',title:'How many churches are under your jurisdiction?',type:'number',help:'Enter the current number of churches.'},
 {id:'bishopPastorsContacted',title:'How many pastors did you personally communicate with or visit during the past year?',type:'number',help:'Count each pastor once, even if you contacted or visited them several times.'},
 {id:'training',title:'Have you intentionally trained and developed leaders or successors during this annual cycle?',help:'Ministry includes producing and strengthening other leaders.',type:'choice',options:['Yes, consistently','Somewhat','Not during this period']},
 {id:'bishopIntervention',title:'Which churches or pastors presently require intervention or assistance?',type:'text',help:'Name the churches or pastors and describe the support needed. You may request a private conversation for sensitive details.'},
 {id:'bishopJurisdictionChallenges',title:'What are the three greatest challenges within your jurisdiction?',type:'text',help:'Describe the challenges and where support would be most useful.'},
 {id:'bishopLeadershipMeetings',title:'Did you hold leadership meetings with your pastors?',type:'choice',options:['Yes','No'],followUps:[{id:'bishopLeadershipMeetingsDetails',label:'How often did you meet, and what were the main outcomes?',type:'text',when:'Yes'}]},
 {id:'integrity',title:'Is there any matter of conduct, marriage, finance, authority or personal integrity that requires confidential review?',help:'You may request a private conversation without writing the details here.',type:'choice',options:['No matter to disclose','Yes — I request a confidential review']},
 {id:'bishopGrowthTarget',title:'What is your growth target for the coming year?',type:'text',help:'Describe your targets and the practical steps you plan to take.'},
 {id:'intention',title:'Do you wish to continue serving as a leader for the coming year?',help:'If you intend to resign, select that option. D.R.O.G.S will contact you privately.',type:'choice',options:['I wish to continue','I wish to resign','I need to discuss my position']}
];
