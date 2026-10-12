import timeline from "./timeline.json";
import { getAllChapters } from "./chapters";
import { SURVEY_VERSION, type SurveyQuestion } from "./inner-court-survey";

type Viewpoint = { prompt: string; options: string[]; characters: string[] };
type ChapterEvent = { id: string; sources: string[]; viewpoints: Partial<Record<"jace" | "visenor" | "gaelor", Viewpoint>>; gm: string[] };
const p = (prompt: string, options: string[], characters: string[] = []): Viewpoint => ({ prompt, options, characters });
const e = (id: string, sources: string[], viewpoints: ChapterEvent["viewpoints"], gm: string[]): ChapterEvent => ({ id, sources, viewpoints, gm });

// Editorial scene groups, not automatic cast/name matching. Timeline casts can
// include absent or discussed characters; each player viewpoint is deliberate.
// Source titles are explicit references to the canonical timeline scene inventory.
export const chapterSurveyEvents: Record<string, ChapterEvent[]> = {
  "the-poison-beneath-the-crown": [
    e("poison", ["The King is poisoned", "The Royal Kitchen Executions"], {
      jace: p("After the poisoning and kitchen executions, what troubles you most?", ["Fear has displaced justice", "Loyal servants were treated as disposable", "The Crown still needs a trustworthy investigation"], ["baelenys-targaryen"]),
      visenor: p("How do you reconcile fear for your father with the kitchen executions?", ["I want the true poisoner punished", "Collective punishment leaves the truth unresolved", "My anger may be clouding my judgment"], ["baelenys-targaryen"]),
    }, ["The victims of collective punishment", "Fear becoming royal policy", "Evidence lost amid the response"]),
    e("hatchlings", ["Three dragons hatch for one prince"], {
      jace: p("What does the dispute over Visenor's hatchlings leave you thinking?", ["A gift has become a contest for favour", "Sharing dragons could change the family's balance", "Visenor's attachment deserves respect"], ["visenor-targaryen"]),
      visenor: p("What do the three hatchlings mean to you?", ["A bond I do not want divided", "A responsibility larger than possession", "A source of hope amid the crisis"], ["jacaelon-targaryen", "gaelor-targaryen"]),
    }, ["The brothers' competing expectations", "The meaning of a dragon bond", "A private joy turned into a dynastic resource"]),
    e("dying-accusation", ["\"The Hand\""], {
      gaelor: p("How much weight do you give the dying poisoner's accusation against the Hand?", ["It gives us a suspect to pursue", "It is an accusation rather than proof", "Killing him ended the chance to question him further"], ["derrin-hightower"]),
    }, ["The reliability of a dying accusation", "The witness who can no longer answer", "The danger of acting on the name alone"]),
    e("hidden-letter", ["Rhaella's secret letter"], {
      jace: p("How do you regard the private agreement to protect Rhaella from exposure?", ["Cooperation may protect the family better than punishment", "Using her secret gives me power I must handle carefully", "Visenor's trust matters beyond the immediate bargain"], ["rhaella-targaryen", "visenor-targaryen", "saera-targaryen"]),
      visenor: p("What does Rhaella's hidden correspondence do to your trust?", ["I need to hear her reasons", "Her secrecy hurts even if I understand it", "The court may use this against her regardless of the truth"], ["rhaella-targaryen"]),
    }, ["Rhaella's reasons for secrecy", "The marriage under royal scrutiny", "The distinction between correspondence and treason"]),
  ],
  "the-price-of-trust": [
    e("blackfyre", ["Blackfyre changes hands"], {
      visenor: p("What stays with you after your father takes Blackfyre and strikes you?", ["The humiliation before the court", "The loss of trust between us", "A sword cannot decide my worth"], ["baelenys-targaryen", "gaelor-targaryen"]),
      gaelor: p("What does receiving Blackfyre from your father mean to you?", ["Recognition I have wanted", "A responsibility I must prove worthy of", "My gain is bound to Visenor's humiliation"], ["baelenys-targaryen", "visenor-targaryen"]),
    }, ["Public humiliation within the family", "A symbol mistaken for a settled succession", "Gaelor's new expectations"]),
    e("escape", ["Visenor's escape"], {
      visenor: p("What guides your decision to leave with Rhaella?", ["I will not purchase favour with her life", "Our safety must come before returning to court", "I fear what my choice costs Alester"], ["rhaella-targaryen", "alester-dayne"]),
    }, ["The cost of refusing the King", "Alester's competing obligations", "Escape as a choice rather than a safe resolution"]),
    e("confession", ["The Hand's confession"], {
      jace: p("After Derrin's confession and secret execution, what remains unresolved for you?", ["Who else enabled the conspiracy", "What secrecy will cost my authority", "Whether my methods can be justified"], ["derrin-hightower"]),
    }, ["The hidden death and its consequences", "The distinction between confession and the wider conspiracy", "Jace's use of secrecy"]),
  ],
  "the-weight-of-loyalty": [
    e("bank-evidence", ["The Iron Bank confirms the truth", "Lorent Tyrell is executed"], {
      jace: p("What do the bank's confirmation and Lorent's punishment make you consider?", ["Evidence must remain distinct from suspicion", "Punishment will affect households beyond the guilty", "The conspiracy may have consequences beyond one death"], ["derrin-hightower", "lorent-tyrell"]),
    }, ["Documented responsibility", "The Reach after Lorent's execution", "Succession within House Tyrell"]),
    e("wedding-and-office", ["A wedding and a new Hand"], {
      jace: p("What does receiving the Hand's badge demand of you now?", ["Earn authority through competent decisions", "Protect the realm from the court's anger", "Learn whom I can rely on"], ["jaery-targaryen"]),
      gaelor: p("At your wedding to Naella, what do you want this bond to become?", ["A partnership beyond court politics", "A household whose future I can protect", "A place where I need not compete with my brothers"], ["naella-velaryon"]),
    }, ["A marriage with its own personal stakes", "Jace's new institutional responsibility", "Favour and rivalry at the same ceremony"]),
    e("rescue-and-refuge", ["Ambush in the Dornish woods", "Sanctuary at Starfall"], {
      visenor: p("After the ambush and Lorenah's welcome, where does your trust rest?", ["With Alester, who risked his life", "With Lorenah, who accepted the danger of sheltering us", "With caution: sanctuary does not end the pursuit"], ["alester-dayne", "lorenah-dayne", "rhaella-targaryen"]),
    }, ["The lasting price of Alester's protection", "House Dayne's exposure", "Safety that remains conditional"]),
  ],
  "the-broken-knight": [
    e("reach-march", ["The march on the Reach begins"], {
      gaelor: p("As you ride toward the Reach, how do you understand your father's command?", ["I am enforcing the Crown's judgment", "I must distinguish submission from resistance", "This is my chance to prove I can command"], ["baelenys-targaryen"]),
    }, ["The limits of the punitive order", "Command decisions beyond the King's presence", "The Reach's reception of royal force"]),
    e("winterfell", ["Saera's visit to Winterfell"], {}, ["Saera's reasons to remain", "Rickard's grief and new responsibilities", "Diplomacy becoming personal"]),
  ],
  "fathers-and-their-sins": [
    e("oldtown", ["The Oldtown Massacre"], {
      gaelor: p("Looking at what happened in Oldtown, where do you place your responsibility?", ["I acted on the King's command", "The violence escaped its intended bounds", "My own decisions helped determine the outcome"], ["timos-hightower", "alysanne-hightower", "brant-costayne"]),
    }, ["The people lost in Oldtown", "Escalation from execution to massacre", "Responsibility shared without being erased"]),
    e("stormsend", ["Maela at Storm's End"], {}, ["Maela's own desires", "Vance's vows and vulnerability", "Marriage diplomacy and private choices"]),
    e("baelor-return", ["Baelor's return"], {
      gaelor: p("How do you receive Baelor's horror at the aftermath?", ["He does not understand the situation I faced", "His reaction makes the cost harder to dismiss", "I want to explain my part rather than be judged by rumour"], ["baelor-targaryen"]),
    }, ["A witness who challenges the royal account", "Baelor's return to political life", "The distance between command and aftermath"]),
  ],
  "a-crown-of-thorns": [
    e("drawn-sword", ["The family fractures"], {
      jace: p("What remains with you after your father draws Blackfyre on you and Gaelor?", ["His anger makes the family unsafe", "Vhaemys should never have had to stop him", "Gaelor and I shared a danger despite our rivalry"], ["baelenys-targaryen", "gaelor-targaryen", "vhaemys-targaryen"]),
      gaelor: p("How do you understand the confrontation with your father?", ["His favour offers no guarantee of safety", "I resent being threatened after serving him", "Vhaemys's intervention matters more than my pride"], ["baelenys-targaryen", "jacaelon-targaryen", "vhaemys-targaryen"]),
    }, ["The children's safety", "Saera's challenge to Baelenys", "Vhaemys carrying an adult burden"]),
    e("grand-maester", ["Baelor named Grand Maester"], {}, ["Baelor's independence from the King", "Cordin's displacement", "Whether counsel can restrain royal violence"]),
    e("pregnancy-and-dragon", ["Rhaella's pregnancy and the legend of Boneskin"], {
      visenor: p("How do Rhaella's pregnancy and the accounts of Boneskin change your hopes?", ["Our child's safety becomes central", "The dragon offers a possible future beyond hiding", "Hope should not make me careless"], ["rhaella-targaryen"]),
    }, ["A future family under concealment", "Lore that is not yet a dragon bond", "The risks of pursuing new hope"]),
    e("alester-home", ["Lady Dayne's envoy reaches King's Landing"], {
      jace: p("What do you feel you owe Alester when he returns wounded?", ["Care rather than another immediate demand", "Recognition of the price he paid", "A chance to speak without having to prove his loyalty"], ["alester-dayne", "lorenah-dayne"]),
    }, ["Protection that left lasting wounds", "Dayne diplomacy", "Loyalty expressed without explanation"]),
  ],
  "the-climb-and-the-kneel": [
    e("whent", ["Curtass Whent confirmed dead"], {}, ["The circumstances of Whent's death", "Baelenys's indifference", "What different characters actually learn"]),
    e("city-and-knighthood", ["A night in Flea Bottom", "Jace is knighted"], {
      jace: p("What do the evening with Lorenah and Alester's private knighting let you hold onto?", ["A life beyond my office", "Honour measured privately rather than by applause", "Trust in the people who see me without ceremony"], ["lorenah-dayne", "alester-dayne"]),
    }, ["Jace's life outside court", "A private vow with lasting significance", "Lorenah and Alester's distinct bonds with him"]),
    e("naella-pregnancy", ["Naella's pregnancy"], {
      gaelor: p("What does Naella's pregnancy change for you?", ["I want to be a father my child can trust", "Our family's future feels more immediate", "My father's warmth matters, but should not define this joy"], ["naella-velaryon", "baelenys-targaryen"]),
    }, ["Parenthood beyond the succession", "Naella's experience", "Baelenys's unusual warmth"]),
    e("boneskin-trust", ["Visenor tames Boneskin"], {
      visenor: p("What did earning Boneskin's trust teach you?", ["Patience can achieve what force cannot", "A bond must be earned rather than claimed", "I have found something I want to protect"], []),
    }, ["Patient contact with an intelligent creature", "The difference between trust and control", "Visenor's new possibilities"]),
  ],
  "the-viper-in-silk": [
    e("vance", ["Gaelor executes Ser Vance"], {
      gaelor: p("After killing Vance, what do you tell yourself about Maela?", ["I protected the family from scandal", "I decided her future without asking her", "The secret may change our relationship even if she never learns it"], ["maela-targaryen", "brannyn-vance"]),
    }, ["Maela's knowledge versus Gaelor's", "The cost of concealed violence", "Protection as a justification for control"]),
    e("exile-policy", ["The council turns toward Vahaemon"], {
      jace: p("How do you view driving Vahaemon toward Tyrosh?", ["Containment may be safer than direct confrontation", "Moving the threat may only give it new allies", "Reports of his dragon require careful verification"], ["vahaemon-targaryen", "baelor-targaryen"]),
    }, ["Displacement rather than removal of a threat", "The reliability of dragon reports", "Free Cities with interests of their own"]),
    e("first-flight", ["Visenor rides Boneskin"], {
      visenor: p("After your first flight and moving the egg, what matters most?", ["Keeping Boneskin and the egg safe", "Understanding the responsibility of being a rider", "Preserving the secrecy that protects us"], []),
    }, ["The new rider's responsibility", "The egg's hidden location", "Power gained under concealment"]),
    e("dark-sister", ["Visenya's ambush in Flea Bottom"], {
      jace: p("What unsettles you most about Visenya's ambush?", ["How close she came without being recognised", "Her connection to Vahaemon", "The unanswered reasons for her presence"], ["visenya-targaryen", "alester-dayne"]),
    }, ["The limits of palace security", "Visenya's mistaken identification", "Questions left by her escape"]),
  ],
  "the-brothers-tilt": [
    e("guard-and-revenge", ["The gates are doubled", "Ser Costayne's revenge"], {
      jace: p("After the security warning and Costayne's attack, what needs your attention?", ["The reach of threats within the capital", "The consequences of Oldtown returning to court", "Security that does not become indiscriminate punishment"], ["brant-costayne", "gaelor-targaryen"]),
      gaelor: p("What does Costayne's attack leave you thinking about Godfrey?", ["I owe him my life", "Oldtown's survivors will not simply forget", "I do not want needing rescue to define me"], ["brant-costayne", "godfrey-blackwood"]),
    }, ["Revenge entering a royal spectacle", "Godfrey's intervention", "Security and unresolved grievance"]),
    e("lists", ["Saathos defeats Ser Tarly", "Alester advances in the lists", "Steffon unhorses the Tully knight", "Jace unhorses Godfrey Blackwood", "Steffon defeats Alester", "Gaelor defeats Ser Aldwyn Glover", "Jace defeats Saathos Maris"], {
      jace: p("What stays with you from facing Godfrey and Saathos in the lists?", ["Respect can survive a hard contest", "Victory is inseparable from the injuries we inflict", "I wanted to know Saathos would live"], ["godfrey-blackwood", "saathos-maris"]),
      gaelor: p("What does riding on after Costayne's attack mean to you?", ["I refused to let injury end my standing", "My determination came with further danger", "Winning did not make the day's violence disappear"], []),
    }, ["Chivalry alongside serious injuries", "Rivalries that differ from hatred", "The cost of continuing wounded"]),
    e("brothers-collapse", ["The final tilt"], {
      jace: p("What does the tilt with Gaelor reveal about your rivalry?", ["Neither of us knew when to stop", "I wanted to prove more than riding skill", "Mutual ruin is no kind of victory"], ["gaelor-targaryen"]),
      gaelor: p("How do you look at the contest that left both brothers unable to rise?", ["I would not yield to him", "We turned rivalry into mutual injury", "The result settled nothing between us"], ["jacaelon-targaryen"]),
    }, ["A spectacle without a victor", "The brothers' inability to yield", "Physical wounds carrying political meaning"]),
  ],
  "fireflies": [
    e("shared-infirmary", ["Mending the broken"], {
      jace: p("What is it like recovering beside Gaelor?", ["Closeness does not erase resentment", "His injuries make our shared cost impossible to ignore", "I do not know how to begin a different relationship"], ["gaelor-targaryen"]),
      gaelor: p("What does sharing the infirmary with Jace do to your anger?", ["It remains, even while I am dependent on care", "I can see what our contest cost him", "Being forced together is not the same as reconciliation"], ["jacaelon-targaryen"]),
    }, ["Recovery rather than a reset of the rivalry", "Forced proximity", "The aftermath of mutual injury"]),
    e("fireflies", ["The King's command"], {
      jace: p("How do you receive your father's demand for peace?", ["I hear exhaustion beneath the command", "Peace requires more than an order", "I want to prevent another confrontation like the tilt"], ["baelenys-targaryen", "gaelor-targaryen"]),
      gaelor: p("What would make your father's plea for peace meaningful?", ["Recognition that both brothers carry grievances", "Actions that do not continually pit us against each other", "A chance to choose peace rather than perform obedience"], ["baelenys-targaryen", "jacaelon-targaryen"]),
    }, ["A father's plea within a King's command", "Peace without instant reconciliation", "Whether later conduct supports the request"]),
  ],
  "the-manders-pact": [
    e("nameday-and-citadel", ["Visenor's nameday at Starfall", "Visenor infiltrates the Citadel"], {
      visenor: p("What pulls at you as you leave Rhaella's nameday gift behind for the Citadel?", ["The life we might build together", "Knowledge that could help secure that future", "Concern that searching for power draws me away from her"], ["rhaella-targaryen", "baelor-targaryen"]),
    }, ["A personal gift before departure", "Knowledge taken through deception", "Rumour distinguished from proven dragon lore"]),
    e("oldtown-survival", ["Ambushed in Oldtown's streets", "Visenor before Lady Melessa"], {
      visenor: p("How do Martyn's recognition and Melessa's restraint affect you?", ["I owe both a debt despite our houses' history", "My disguise is less secure than I hoped", "Her refusal to expose me is not the same as forgiveness"], ["martyn-mullendore", "melessa-hightower"]),
    }, ["Recognition that could have become exposure", "Melessa's losses", "Protection without reconciliation"]),
    e("pact", ["The Mander's Pact"], {
      visenor: p("What is hardest to weigh in accepting Renrose's terms?", ["The strength his support offers", "The influence promised through the Handship", "Committing our children's futures to an alliance"], ["renrose-tyrell"]),
    }, ["The price of Reach support", "Promises involving future children", "Tutoring as repayment to a harmed household"]),
    e("trial-and-heir", ["Costayne's trial set and a hint of combat", "Gaelor asks to be named heir"], {
      jace: p("Why plant the possibility of combat in Costayne's mind?", ["It offers a lawful route through an ugly dispute", "Gaelor should confront the consequences himself", "I need to examine how much rivalry shapes my judgment"], ["brant-costayne", "gaelor-targaryen"]),
      gaelor: p("What do you take from your father deferring your request to be named heir?", ["He expects proof through action", "My position is less secure than it should be", "I want recognition that does not depend on another war"], ["baelenys-targaryen"]),
    }, ["Law used within a personal rivalry", "An unresolved succession request", "Proof of worth framed through war"]),
  ],
  "the-trial": [
    e("costayne-verdict", ["The trial of Ser Brant Costayne"], {
      jace: p("What do you carry from the compromise that Costayne's demand overturns?", ["I tried to balance law with mercy", "The legitimacy of the process matters even when it frustrates me", "His grievances cannot be dismissed as mere defiance"], ["brant-costayne", "baelor-targaryen", "berholt-caswell"]),
      gaelor: p("How do you receive Costayne's public defence and demand for combat?", ["He challenges my honour as much as my life", "His hatred is rooted in Oldtown", "I want the dispute settled before the court"], ["brant-costayne"]),
    }, ["A compromise rejected by the accused", "Faith and Crown disagreeing over justice", "The grievance beneath the combat demand"]),
    e("arthur-sand", ["Maester Arthur Sand arrives at the Hightower"], {
      visenor: p("Why does limiting Tyrell swordsmen around Arthur Sand matter to you?", ["I need room to act independently", "A small trusted circle is safer than a large household guard", "Renrose's support must not become constant oversight"], ["leo-tyrell", "melessa-hightower"]),
    }, ["A disguise sustained by a small circle", "Independence from Tyrell oversight", "A tutor's obligations in the Hightower"]),
  ],
  "the-broken-oak": [
    e("blow-and-boundary", ["Gaelor strikes Jace", "Jace draws his line"], {
      jace: p("What do you mean to preserve by refusing to recognise Gaelor as king?", ["A limit beyond which I will not obey", "A future protected from his violence", "My own agency after being struck and restrained"], ["gaelor-targaryen", "baelenys-targaryen"]),
      gaelor: p("What do you make of striking Jace in the King's doorway?", ["Anger took the place of an argument", "I wanted him to feel the consequences of provoking me", "The blow deepened a conflict it could not settle"], ["jacaelon-targaryen"]),
    }, ["Violence inside a succession dispute", "Jace's declared limit", "Alester's effort to prevent escalation"]),
    e("visenya-intelligence", ["Weylar's intelligence"], {
      jace: p("What deserves caution in Weylar's report about Visenya and a dragon?", ["The difference between a lead and confirmed intent", "The possibility that our watchers are missing part of the network", "How quietly we can investigate without alarming the city"], ["weylar-rocke", "visenya-targaryen"]),
    }, ["Intelligence with incomplete verification", "Agents in Flea Bottom", "A dragon rumour with political consequences"]),
  ],
  "the-reunion": [
    e("border-justice", ["Lord Blackwood Before the Hand"], {
      jace: p("What principle guides your answer to Godfrey's demand?", ["The Crown must offer a credible alternative to war", "Both houses need a process they can accept", "A lawful challenge can still carry the risk of escalation"], ["godfrey-blackwood"]),
    }, ["Grievance before open conflict", "The Crown's proposed alternatives", "A process that may not satisfy both houses"]),
    e("dragonstone-feast", ["The Nameday Feast on Dragonstone"], {
      jace: p("What does the confrontation between Baelenys and Malaenar make you consider?", ["Old family wounds still govern present decisions", "A moment of warmth does not erase what was said", "I want my bond with Lorenah to offer a different kind of future"], ["baelenys-targaryen", "malaenar-targaryen", "lorenah-dayne"]),
      gaelor: p("What do you take from the brothers' confrontation on Dragonstone?", ["The older generation has not resolved its own rivalries", "Their history casts a shadow over our succession", "Reconciliation can begin without settling every grievance"], ["baelenys-targaryen", "malaenar-targaryen"]),
    }, ["Old wounds without instant resolution", "Tansy's attempt to create a celebration", "A younger generation watching its elders"]),
    e("tyrosh-raven", ["Vahaemon Sails for Tyrosh"], {
      gaelor: p("What does the intercepted news of Vahaemon sailing for Tyrosh suggest?", ["Exile is not keeping him politically harmless", "Who controls information matters at court", "The report deserves attention before its implications are assumed"], ["vahaemon-targaryen", "baelor-targaryen"]),
    }, ["Information intercepted within the family", "Tyrosh's possible interests", "A report rather than a completed alliance"]),
  ],
  "the-glass-flower": [
    e("betrothal", ["Jace and Lorenah are betrothed"], {
      jace: p("What do you most want to honour in Lorenah accepting your proposal?", ["Her choice of me as a person", "A partnership that allows disagreement", "A future larger than our political usefulness to each other"], ["lorenah-dayne"]),
    }, ["Lorenah's agency in accepting", "Personal commitment alongside alliance", "The future the couple is imagining"]),
    e("cordin-alliance", ["Gaelor and Cordin's covert alliance"], {
      gaelor: p("What limit, if any, should govern Cordin's surveillance for you?", ["It should protect me from real threats", "Its usefulness does not guarantee its honesty", "Watching everyone can make trust impossible"], ["cordin-poole"]),
    }, ["Information as a form of dependence", "Cordin's own incentives", "Surveillance changing family relationships"]),
    e("gardener-plan", ["Visenor begins the Gardener framing"], {
      visenor: p("As the Gardener scheme begins, what concerns you about the path you are choosing?", ["Whether deception can prevent a greater danger", "Who may suffer if the Crown believes it", "How easily an expedient lie could become a habit"], []),
    }, ["The intended political result of fabricated evidence", "Unintended victims", "Communication with Rhaella under concealment"]),
    e("northern-return", ["Saera and Alester arrive at Winterfell", "Saera sees again"], {}, ["Saera's brief restored sight", "Mother Marya's uncertain intervention", "Alester and Rickard's different relationships with Saera"]),
  ],
  "the-mummers-blood": [
    e("maelwing-memory", ["Baelenys claims Maelwing"], {}, ["Rescue within the brothers' earlier rivalry", "The cost of a failed dragon approach", "A past bond that complicates present hostility"]),
    e("watch-and-spies", ["Daria reports to Lorenah", "Gaelor is promised the City Watch"], {
      gaelor: p("What do you want from the promised command of the City Watch?", ["A chance to prove I can keep order", "An institution able to act on my information", "Recognition that must be earned through restraint"], ["cordin-poole", "baelenys-targaryen"]),
    }, ["A promise mistaken for an appointment", "Daria's reporting and Lorenah's knowledge", "Information held differently on each side"]),
    e("servants-and-lore", ["The Mustang returns", "A letter from Oldtown and the mystery of Ghost"], {
      jace: p("What do you take from Baelor's uncertain accounts of Dreamers and Ghost?", ["Old lore may hold clues worth following", "Uncertainty must remain visible in our conclusions", "A quiet investigation is safer than public claims"], ["baelor-targaryen", "visenya-targaryen"]),
    }, ["Lucas's protection of the servants", "Dragon lore distinguished from proof", "A quiet investigation into Visenya"]),
    e("mummers", ["The Mummers' Blood"], {
      gaelor: p("What stays with you after the crowd is trapped and people die?", ["My orders helped shape the disaster", "The force used against mockery demands explanation", "Releasing the crowd did not undo what had happened"], ["saathos-maris", "mydan-gerren"]),
    }, ["The dead and wounded beyond the performers", "Saathos's different use of force", "Mydan surviving into custody"]),
  ],
  "the-children-pay": [
    e("forgery-and-highgarden", ["Visenor builds the Vhagar deception", "Visenor brings the plot to Highgarden"], {
      visenor: p("What does Renrose's agreement to the Gardener scheme mean to you?", ["I have gained the backing needed to attempt it", "His gain from the scheme deserves scrutiny", "The plan's usefulness does not remove its moral cost"], ["almar-larchmont", "renrose-tyrell"]),
    }, ["Renrose's private interests beyond his assurances", "Uncertain Vhagar lore used to support a lie", "What Visenor does not hear after leaving"]),
    e("starfall-tragedy", ["Rhaella waits for the missing maester", "The death of Rhaella Targaryen"], {}, ["Rhaella's isolation and unanswered questions", "Her final agency amid violence", "The tragedy remaining unknown to Visenor"]),
    e("city-response", ["Gaelor is banished to Driftmark", "Crown and Faith answer the massacre"], {
      jace: p("What must the Crown's response to the Mummers' Blood achieve?", ["Practical help for people harmed", "Accountability that does not trigger more violence", "Cooperation with the Faith without pretending trust is restored"], ["berholt-caswell", "oswald-eagle"]),
      gaelor: p("What does losing the Watch command and being sent to Driftmark tell you?", ["My father's support has limits", "My actions cost me the role I wanted", "I resent exile but need to decide what comes after it"], ["baelenys-targaryen"]),
    }, ["Accountability beyond banishing one prince", "The Faith's role in relief", "Oswald's continued command"]),
    e("return-and-story", ["Saera begins the flight south", "A story at sunset"], {
      jace: p("As your father prepares to tell you a story, how do you receive the invitation?", ["I want to understand what he has kept from me", "Closeness does not make his intentions certain", "I will listen before deciding what this changes"], ["baelenys-targaryen"]),
    }, ["A return from the North", "A confidence not yet disclosed", "Avoiding a premature succession conclusion"]),
  ],
  "until-the-last-breath": [
    e("old-promise-and-ash", ["Jaery promises Rhaella a future beside Visenor", "The ash at Boneskin's cave"], {}, ["Jaery's old promise to Rhaella", "An aftermath without full identification", "The gap between memory and present knowledge"]),
    e("dream-and-dreamer", ["Baelenys entrusts Jace with Aegon's dream", "Vhaemys dreams of fire and a white dragon"], {
      jace: p("How do Aegon's dream and Vhaemys's visions change the burden you carry?", ["I must protect the realm beyond immediate court struggles", "Vhaemys needs care before anyone asks to use her gift", "I must preserve uncertainty rather than force the visions into an answer"], ["baelenys-targaryen", "vhaemys-targaryen"]),
    }, ["A secret entrusted to Jace alone", "A child distinguished from her possible gift", "The King's intention versus a formal investiture"]),
    e("mydan-and-costayne", ["Jace hears the last of the Motley Three", "Brant Costayne chooses his trial"], {
      jace: p("What do Mydan's account and Costayne's chosen trial ask of your sense of justice?", ["Hear survivors without making excuses for the Crown", "Keep the promised help to Mydan concrete", "A lawful combat will not erase the victims' losses"], ["mydan-gerren", "brant-costayne"]),
    }, ["The surviving mummer's voice", "A promise of protection and help", "Legal resolution versus lasting harm"]),
    e("companions", ["Leo carries Highgarden's secret", "Saera and Alester return from the North"], {
      jace: p("What matters most in having Saera and Alester home again?", ["The return of people I trust", "Making room for what they experienced away from court", "Not treating their presence as an unlimited resource"], ["saera-targaryen", "alester-dayne"]),
    }, ["Leo's private conflict without giving Visenor that knowledge", "The returning companions' own experiences", "Loyalties that cannot be reduced to faction"]),
  ],
  "judgment-by-blood": [
    e("past-and-exile", ["Aenys destroys Malaenar's dragon", "The Crown learns what Vahaemon has built", "Aegor and Sunfyre are revealed"], {
      jace: p("What does the news of Vahaemon's wider dragon threat demand from you?", ["Assess what the reports actually establish", "Prepare beyond the assumptions of an isolated exile", "Keep family history from replacing strategic judgment"], ["vahaemon-targaryen"]),
    }, ["Childhood cruelty in the royal history", "The scale of Vahaemon's network", "Aegor's appearance beyond the Crown's complete knowledge"]),
    e("starfall-and-confidences", ["Rhaella and Nymos are reported missing", "Alester finally speaks about Saera"], {
      jace: p("How do the Starfall report and Alester's confidence affect whom you rely on?", ["Lorenah's unfamiliarity with Nymos deserves attention", "Alester needs to be heard as a person as well as a protector", "Trust does not relieve us of checking the facts"], ["lorenah-dayne", "alester-dayne", "nymos"]),
    }, ["Nymos as a lead rather than an established culprit", "Alester speaking about Saera", "Personal confidences beside urgent investigation"]),
    e("oldtown-report", ["The Gardener forgery is completed", "Leo searches Almar's chambers", "The Starfall dragon report reaches Oldtown"], {
      visenor: p("What does the report of burned men and a dragon near Starfall make you prioritise?", ["Learning whether Rhaella is safe", "Finding out whether the dragon was Boneskin", "Separating what I fear from what the report proves"], ["rhaella-targaryen", "almar-larchmont"]),
    }, ["The completed forgery", "Leo's search unknown to Visenor", "A frightening report without a confirmed fate"]),
    e("return-and-combat", ["Jace forces Costayne's trial forward", "Gaelor returns to a hostile capital", "Brant Costayne dies in trial by combat"], {
      jace: p("What does the completed trial by combat settle, and what does it leave behind?", ["The legal dispute has an outcome", "Oldtown's grief remains", "Gaelor's place in the family is still contested"], ["gaelor-targaryen", "brant-costayne"]),
      gaelor: p("After returning to hostility and surviving Costayne, what recognition do you seek?", ["Acceptance of the combat's outcome", "Respect that lasts beyond a single victory", "Room to pursue a future outside the capital"], ["brant-costayne", "baelenys-targaryen"]),
    }, ["Legal vindication without universal approval", "The hostility of the returning prince's audience", "Baelenys's warning after the victory"]),
  ],
  "the-eye-in-the-storm": [
    e("essos-charge", ["Baelenys sends Jace after Visenya and Naela"], {
      jace: p("What weighs most in being sent after Visenya and Naela?", ["The danger to everyone who goes with me", "The personal cost of acting against family", "Choosing companions for the task rather than for court advantage"], ["visenya-targaryen", "naela-targaryen", "baelenys-targaryen"]),
    }, ["A mission with real risk rather than a training exercise", "The Crown's family targets", "Gaelor discussed without being recruited"]),
    e("exile-and-overheard", ["Vahaemon offers Vaenarr a place in his future reign", "Vhaemys overhears the royal marriage fracture"], {}, ["Vahaemon's offer to Vaenarr", "Vhaemys hearing the royal marriage conflict", "Knowledge confined to separate conversations"]),
    e("dornish-journey", ["Visenor and Leo agree to seek the Dornish dragon"], {
      visenor: p("What does Leo agreeing to go toward Dorne mean to you?", ["I value the companionship", "His caution deserves a hearing", "I need to explain what I hope to learn rather than assume he understands"], ["leo-tyrell"]),
    }, ["Leo's divided loyalties", "The purpose of the journey as each companion understands it", "A suspicion of pursuit without proof"]),
    e("storm-dragon", ["A white dragon meets Vhaemys in the storm"], {
      jace: p("What stays with you from the white dragon responding to Vhaemys?", ["Her experience cannot be dismissed as childish fear", "The dragon's identity remains unknown", "Keeping her safe requires listening as well as directing"], ["vhaemys-targaryen", "saera-targaryen"]),
    }, ["Vhaemys heard before she is fully understood", "The dragon responding to her rather than Jace", "No premature identity or bond confirmation at this chapter"]),
  ],
  "of-ravens-and-bitter-blood": [
    e("border-blood", ["Bloodshed on the Blackwood–Bracken border"], {}, ["Hendry's death and the families' grief", "Escalation without a confirmed wider war", "Godfrey's expectation of Stark support rather than a new pledge"]),
    e("dragonpit-and-visit", ["The white dragon is brought to the Dragonpit", "Celtigar visits the royal court"], {
      jace: p("What matters most now that Vhaemys's white dragon is in the Dragonpit?", ["Her safety and happiness beyond the excitement", "Learning about the dragon without guessing its identity", "Letting her keep ordinary friendships such as Annara's"], ["vhaemys-targaryen", "saera-targaryen", "annara-celtigar"]),
    }, ["A confirmed rider with an unidentified dragon", "Ordinary friendship within extraordinary change", "Celtigar's unspecified marriage approach"]),
    e("mission-and-breakfast", ["Lorenah counsels Jace on the Essos company", "Baelenys leaves the mission decision to his heir"], {
      jace: p("After Lorenah's counsel and the royal breakfast, what should decide Gaelor's place in the company?", ["The companions' assessment of the risk", "The mission's needs rather than an attempt to reform him", "My responsibility to make and own the decision"], ["lorenah-dayne", "gaelor-targaryen", "baelenys-targaryen"]),
    }, ["Jace's decision rather than a completed recruitment", "Jaery's treatment at breakfast", "The King's cough without an invented diagnosis"]),
    e("hunger-report", ["Weylar reports hunger turning to anger"], {
      jace: p("What should follow Weylar's report of hunger and withdrawn patrols?", ["Pursue provisions against Tyrell debt", "Prevent the Watch from answering anger with violence", "Demand useful information without treating hypotheses as facts"], ["weylar-rocke", "oswald-eagle"]),
    }, ["Hunger as a practical problem", "Withdrawn patrols and reported hostility", "A proposal for grain rather than an agreed deal"]),
    e("return-to-starfall", ["Visenor and Leo sail south"], {
      visenor: p("During the journey south with Leo, how do you weigh his caution?", ["His concern deserves respect", "Ordinary clothes offer discretion rather than guaranteed safety", "I suspect we are watched but have no proof"], ["leo-tyrell"]),
    }, ["A quiet departure from Oldtown", "Ordinary clothes as a precaution", "Suspicion of pursuit without proof"]),
    e("empty-refuge", ["Visenor returns to an empty refuge"], {
      visenor: p("What do the empty room and the servants' accounts leave you resolved to do?", ["Remain until Rhaella is found", "Work with Edric to widen the search", "Investigate Nymos and the ravens without assuming the explanation"], ["rhaella-targaryen", "edric-dayne", "nymos", "edmyn-uller"]),
    }, ["Visenor's refusal to leave", "Unverified stories about Nymos and the letters", "The emotional force of an absence without an answer"]),
  ],
};

export function chapterSurveyScope(chapterSlug?: string): string {
  return chapterSlug ? `chapter-counsel-v1:${chapterSlug}` : SURVEY_VERSION;
}
export function getChapterSurveyQuestions(characterId: string, chapterSlug: string): SurveyQuestion[] {
  const chapter = getAllChapters().find((c) => c.slug === chapterSlug);
  const scenes = timeline.find((c) => c.chapterSlug === chapterSlug)?.events;
  const player = characterId === "jacaelon-targaryen" ? "jace" : characterId === "visenor-targaryen" ? "visenor" : characterId === "gaelor-targaryen" ? "gaelor" : null;
  if (!chapter || !scenes || (!player && characterId !== "hrrm")) return [];
  return (chapterSurveyEvents[chapterSlug] ?? []).flatMap((event): SurveyQuestion[] => {
    const view = player ? event.viewpoints[player] : undefined;
    if (player && !view) return [];
    const sourceTitle = scenes.find((scene) => scene.title === event.sources[0])?.title;
    if (!sourceTitle) return [];
    // A grouped timeline title may name a private scene the player did not
    // witness. Use the authored player prompt for their entry heading too.
    return [{ id: event.id, section: chapter.title, chapter: chapterSlug, subject: view?.prompt ?? sourceTitle, characters: view?.characters ?? [], kind: "thought", prompt: view?.prompt ?? `What deserves attention after “${sourceTitle}”?`, options: view?.options ?? event.gm }];
  });
}
