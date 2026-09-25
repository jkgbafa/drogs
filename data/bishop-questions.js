// Shared form definitions keep submitted answers paired with their original questions.
window.BISHOP_QUESTIONS=[
  {id:'intention',title:role=>`Do you wish to continue serving as a ${role} for the coming year?`,help:'If you intend to resign, select that option. The D.R.O.G.S Office will contact you privately.',type:'choice',options:['I wish to continue','I wish to resign','I need to discuss my position']},
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

BISHOP_QUESTIONS.push(BISHOP_QUESTIONS.shift());
