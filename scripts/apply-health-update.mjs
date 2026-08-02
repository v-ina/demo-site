import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = new URL("../", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1");
const site = join(root, "site");
const cssPath = join(site, "_next/static/chunks/g_be_apps_web_src_app_globals_0ound1~.css");

const topics = [
  ["SII", "syndrome-intestin-irritable", "Système digestif", "Syndrome de l’intestin irritable (SII)", "Le syndrome de l’intestin irritable est un trouble digestif chronique associant notamment douleurs abdominales, ballonnements et modifications du transit, sans lésion visible de l’intestin.", ["Douleurs ou crampes abdominales", "Ballonnements", "Constipation, diarrhée ou alternance des deux"], "L’accompagnement aide à repérer les facteurs qui aggravent réellement les symptômes, à éviter les exclusions inutiles et à maintenir une alimentation variée.", "systeme-digestif", "Assurance Maladie", "https://www.ameli.fr/assure/sante/themes/syndrome-intestin-irritable/reconnaitre-syndrome-intestin-irritable"],
  ["Crohn", "maladie-de-crohn", "MICI", "Maladie de Crohn", "La maladie de Crohn est une maladie inflammatoire chronique de l’intestin. Elle peut atteindre différentes parties du tube digestif et évolue généralement par poussées et rémissions.", ["Inflammation chronique du tube digestif", "Évolution par poussées", "Tolérances variables selon les personnes"], "Le suivi nutritionnel s’adapte à la phase de la maladie, aux symptômes, aux traitements et au risque de carences ou de dénutrition, en coordination avec l’équipe médicale.", "systeme-digestif", "Inserm", "https://www.inserm.fr/dossier/maladies-inflammatoires-chroniques-intestin-mici/"],
  ["RCH", "rectocolite-hemorragique", "MICI", "Rectocolite hémorragique (RCH)", "La rectocolite hémorragique est une maladie inflammatoire chronique qui touche le rectum et, de façon plus ou moins étendue, le côlon.", ["Inflammation du rectum et du côlon", "Poussées et rémissions", "Transit parfois fortement perturbé"], "L’accompagnement vise à préserver les apports, ajuster les textures et les choix alimentaires selon la tolérance, et prévenir les restrictions excessives.", "systeme-digestif", "Inserm", "https://www.inserm.fr/dossier/maladies-inflammatoires-chroniques-intestin-mici/"],
  ["Maladie cœliaque", "maladie-coeliaque", "Système digestif", "Maladie cœliaque", "La maladie cœliaque est une maladie intestinale chronique auto-immune déclenchée par l’ingestion de gluten chez des personnes génétiquement prédisposées.", ["Maladie auto-immune", "Réaction permanente au gluten", "Diagnostic médical indispensable avant toute éviction"], "Après confirmation du diagnostic, l’accompagnement aide à mettre en place une alimentation strictement sans gluten, équilibrée et adaptée à la vie quotidienne.", "systeme-digestif", "Assurance Maladie", "https://www.ameli.fr/assure/sante/themes/intolerance-gluten-maladie-coeliaque/definition-causes-facteurs-favorisants"],
  ["Pendant et après traitement", "alimentation-pendant-traitements", "Nutrition & cancer", "Alimentation pendant et après les traitements", "Les traitements contre le cancer peuvent modifier l’appétit, le goût, la digestion, le transit ou la capacité à manger. Les difficultés diffèrent selon le traitement et la personne.", ["Appétit ou goût modifiés", "Troubles digestifs possibles", "Besoins à réévaluer régulièrement"], "Le suivi permet d’adapter les repas aux effets secondaires et de maintenir au mieux les apports, en lien avec l’équipe soignante.", "nutrition-cancer", "Institut national du cancer", "https://www.e-cancer.fr/Patients-et-proches/Qualite-de-vie/Nutrition-et-cancer"],
  ["Dénutrition", "denutrition", "Nutrition clinique", "Dénutrition", "La dénutrition apparaît lorsque les apports ne couvrent plus suffisamment les besoins de l’organisme. Elle peut entraîner une perte de poids et de muscle, de la fatigue et une plus grande fragilité.", ["Perte de poids involontaire", "Diminution de la force ou fatigue", "Apports devenus insuffisants"], "Le repérage précoce est essentiel. L’alimentation peut être enrichie et fractionnée, puis réévaluée avec l’équipe médicale.", "nutrition-cancer", "Haute Autorité de santé", "https://www.has-sante.fr/jcms/p_3118872/fr/diagnostic-de-la-denutrition-de-l-enfant-et-de-l-adulte"],
  ["DME", "diversification-menee-par-enfant", "Petite enfance", "Diversification menée par l’enfant (DME)", "La DME est une manière d’aborder la diversification dans laquelle le bébé explore des aliments adaptés qu’il peut saisir et porter lui-même à la bouche.", ["Formats adaptés aux capacités du bébé", "Présence attentive d’un adulte", "Progression respectueuse du développement"], "L’accompagnement aide à vérifier la sécurité, la variété et les apports, puis à choisir une approche adaptée à l’enfant et à sa famille.", "enfants-adolescents", "Assurance Maladie", "https://www.ameli.fr/assure/sante/themes/alimentation/alimentation-0-3-ans/debut-diversification-alimentaire"],
  ["Oralité", "troubles-oralite-alimentaire", "Enfance", "Troubles de l’oralité alimentaire", "Les troubles de l’oralité alimentaire regroupent des difficultés durables pour accepter, mâcher ou avaler certains aliments.", ["Sélectivité marquée", "Refus de certaines textures", "Repas longs, difficiles ou anxiogènes"], "Le travail nutritionnel vise à sécuriser les apports et à élargir progressivement l’alimentation, souvent avec une prise en charge pluridisciplinaire.", "enfants-adolescents", "Haute Autorité de santé", "https://www.has-sante.fr/jcms/p_3161334/fr/troubles-du-neurodeveloppement-reperage-et-orientation-des-enfants-a-risque"],
  ["TAP", "troubles-alimentaires-pediatriques", "Enfance", "Troubles alimentaires pédiatriques (TAP)", "Les troubles alimentaires pédiatriques désignent des difficultés durables à manger suffisamment, de façon variée ou adaptée à l’âge de l’enfant.", ["Répertoire alimentaire très restreint", "Difficultés avec les textures", "Retentissement sur les repas ou la croissance"], "L’accompagnement vérifie les apports et propose une progression réaliste, en coordination avec le médecin et les autres professionnels concernés.", "enfants-adolescents", "Haute Autorité de santé", "https://www.has-sante.fr/jcms/p_3161334/fr/troubles-du-neurodeveloppement-reperage-et-orientation-des-enfants-a-risque"],
  ["TCA", "troubles-comportement-alimentaire", "Comportement alimentaire", "Troubles du comportement alimentaire (TCA)", "Les TCA sont des troubles complexes dans lesquels l’alimentation, le poids ou l’image du corps occupent une place envahissante et peuvent altérer la santé.", ["Rapport à l’alimentation devenu douloureux", "Préoccupations importantes autour du poids ou du corps", "Prise en charge spécialisée nécessaire"], "Le suivi diététique s’intègre à une prise en charge médicale et psychologique coordonnée, sans jugement ni régime restrictif imposé.", "enfants-adolescents", "Assurance Maladie", "https://www.ameli.fr/assure/sante/themes/troubles-comportement-alimentaire"],
  ["Croissance", "croissance-enfant", "Enfance", "Croissance de l’enfant", "La croissance se suit dans le temps grâce aux courbes de taille, de poids et de corpulence. C’est surtout l’évolution régulière de la courbe qui apporte une information utile.", ["Suivi du poids et de la taille", "Lecture de la dynamique des courbes", "Prise en compte du contexte médical"], "L’accompagnement nutritionnel complète le suivi médical en évaluant les apports, le rythme des repas et les difficultés éventuelles, sans régime restrictif.", "enfants-adolescents", "Santé publique France", "https://www.santepubliquefrance.fr/nutrition-et-activite-physique/surveillance-nutritionnelle-chez-les-enfants"],
  ["Réseau", "repop-reseau", "REPOP", "Réseau de prévention de l’obésité pédiatrique", "Un RéPPOP coordonne des professionnels autour de l’enfant ou de l’adolescent en situation de surpoids ou d’obésité, afin de proposer un accompagnement adapté et suivi dans le temps.", ["Coordination des professionnels", "Accompagnement de la famille", "Suivi inscrit dans la durée"], "La diététique fait partie d’une approche globale qui tient compte de la santé, du quotidien, du mouvement, du sommeil et du vécu de l’enfant.", "enfants-adolescents", "Santé publique France", "https://www.santepubliquefrance.fr/maladies-et-traumatismes/diabete/obesite-et-surpoids"],
  ["Réseau REPPOP", "reseau-reppop", "Enfance", "Réseau REPPOP", "Le REPPOP coordonne l’accompagnement des enfants et adolescents en situation de surpoids ou d’obésité avec leur famille et les professionnels de proximité.", ["Coordination du parcours", "Approche familiale", "Suivi progressif et non stigmatisant"], "La diététicienne intervient dans une démarche globale qui tient compte de la santé, du quotidien et du vécu de l’enfant.", "enfants-adolescents", "Santé publique France", "https://www.santepubliquefrance.fr/maladies-et-traumatismes/diabete/obesite-et-surpoids"],
  ["Pluridisciplinaire", "accompagnement-pluridisciplinaire", "Parcours coordonné", "Accompagnement pluridisciplinaire", "Un accompagnement pluridisciplinaire réunit plusieurs métiers de santé autour d’une même situation. Chacun intervient dans son domaine, avec des objectifs coordonnés.", ["Regards complémentaires", "Objectifs partagés", "Coordination avec le médecin"], "La diététicienne travaille sur l’alimentation et le comportement alimentaire en lien avec les dimensions médicales, psychologiques et l’activité physique.", "enfants-adolescents", "Haute Autorité de santé", "https://www.has-sante.fr/"],
  ["DT1", "diabete-type-1", "Diabète", "Diabète de type 1 (DT1)", "Le diabète de type 1 est une maladie auto-immune dans laquelle le pancréas ne produit plus suffisamment d’insuline.", ["Traitement par insuline indispensable", "Surveillance de la glycémie", "Repères alimentaires individualisés"], "L’accompagnement aide à relier repas, glucides, insuline et activité physique en coordination avec l’équipe de diabétologie.", "diabete", "Assurance Maladie", "https://www.ameli.fr/assure/sante/themes/diabete-type-1/definition"],
  ["DT2", "diabete-type-2", "Diabète", "Diabète de type 2 (DT2)", "Le diabète de type 2 correspond à un excès durable de glucose dans le sang, lié à une moins bonne utilisation de l’insuline puis parfois à une production insuffisante.", ["Évolution souvent progressive", "Suivi médical régulier", "Habitudes de vie adaptées à la personne"], "Le suivi construit des repères alimentaires concrets et durables, compatibles avec le traitement, l’activité physique et le quotidien.", "diabete", "Assurance Maladie", "https://www.ameli.fr/assure/sante/themes/diabete-type-2/definition"],
  ["Diabète gestationnel", "diabete-gestationnel", "Grossesse", "Diabète gestationnel", "Le diabète gestationnel est une élévation de la glycémie diagnostiquée pendant la grossesse. Il nécessite une surveillance adaptée pour la mère et le bébé.", ["Diagnostic pendant la grossesse", "Autosurveillance possible de la glycémie", "Coordination avec l’équipe de maternité"], "L’accompagnement répartit les apports et adapte les repas sans compromettre les besoins nutritionnels de la grossesse.", "diabete", "Assurance Maladie", "https://www.ameli.fr/assure/sante/themes/diabete-gestationnel"]
].map(([label, slug, category, title, definition, points, role, area, sourceLabel, sourceHref]) => ({ label, slug, category, title, definition, points, role, area, sourceLabel, sourceHref }));

const slugByLabel = new Map(topics.map((topic) => [topic.label.toLowerCase(), topic.slug]));
slugByLabel.set("maladie coeliaque", "maladie-coeliaque");
slugByLabel.set("pendant les traitements", "alimentation-pendant-traitements");

const escapeHtml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const read = (path) => readFile(join(site, path), "utf8");
const write = async (path, content) => {
  const target = join(site, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
};

function linkedTags(inner, prefix) {
  return inner.replace(/<span>(.*?)<\/span>/g, (_, rawLabel) => {
    const label = rawLabel === "maladie coeliaque" ? "Maladie cœliaque" : rawLabel;
    const slug = slugByLabel.get(label.toLowerCase());
    return slug ? `<a href="${prefix}${slug}/">${label}</a>` : `<span>${label}</span>`;
  });
}

let home = await read("index.html");
home = home.replace("Un accompagnement spécialisé, à chaque étape.", "Un accompagnement spécialisé et individualisé, à chaque étape.");
const homeHeading = "<h2>Un accompagnement spécialisé et individualisé, à chaque étape.</h2>";
if (!home.includes("action-section-credential")) {
  home = home.replace(homeHeading, `${homeHeading}<p class="action-section-credential">Diététicienne nutritionniste est une profession de santé réglementée, accessible après un diplôme reconnu — BTS, DUT ou BUT. Elle se distingue du médecin nutritionniste, médecin ayant une compétence en nutrition, et des coachs en nutrition, dont l’appellation n’est pas un titre de santé réglementé.</p>`);
}
let homeCards = 0;
if (!home.includes('<article class="action-card">')) {
  home = home.replace(/<a class="action-card" href="([^"]+)"><span class="action-number">([^<]+)<\/span><h3>(.*?)<\/h3><p>(.*?)<\/p><div class="tag-row">(.*?)<\/div><span class="round-arrow" aria-hidden="true">↗<\/span><\/a>/g, (_, href, number, title, description, tags) => {
    homeCards += 1;
    return `<article class="action-card"><span class="action-number">${number}</span><h3><a class="action-card-title-link" href="${href}">${title}</a></h3><p>${description}</p><div class="tag-row">${linkedTags(tags, "definitions/")}</div><a class="round-arrow" aria-label="Découvrir ${escapeHtml(title)}" href="${href}">↗</a></article>`;
  });
  if (homeCards !== 4) throw new Error(`Nombre inattendu de cartes d’accueil : ${homeCards}`);
}
await write("index.html", home.replaceAll("maladie coeliaque", "maladie cœliaque"));

let actions = await read("champs-action/index.html");
let actionCards = 0;
if (!actions.includes('<article class="action-card">')) {
  actions = actions.replace(/<a class="action-card" href="([^"]+)"><span class="action-number">([^<]+)<\/span><h2 style="font-size:2\.1rem">(.*?)<\/h2><p>(.*?)<\/p><div class="tag-row">(.*?)<\/div><span class="round-arrow" aria-hidden="true">↗<\/span><\/a>/g, (_, href, number, title, description, tags) => {
    actionCards += 1;
    return `<article class="action-card"><span class="action-number">${number}</span><h2 style="font-size:2.1rem"><a class="action-card-title-link" href="${href}">${title}</a></h2><p>${description}</p><div class="tag-row">${linkedTags(tags, "../definitions/")}</div><a class="round-arrow" aria-label="Découvrir ${escapeHtml(title)}" href="${href}">↗</a></article>`;
  });
  if (actionCards !== 4) throw new Error(`Nombre inattendu de cartes d’action : ${actionCards}`);
}
await write("champs-action/index.html", actions.replaceAll("maladie coeliaque", "maladie cœliaque"));

let consultations = await read("consultations/index.html");
consultations = consultations.replace("sans précipitation.", "à votre rythme.");
const cardsStart = '<section class="content-section" style="background:var(--beige-100)"><div class="shell cards-three">';
if (!consultations.includes("consultation-app-banner")) {
  consultations = consultations.replace(cardsStart, '<section class="content-section" style="background:var(--beige-100)"><div class="shell consultation-app-banner"><span class="consultation-app-mark" aria-hidden="true">M</span><p>Je vous accompagne entre deux consultations via l’application <strong>MonSuiviDiet</strong>.</p></div><div class="shell cards-three">');
}
if (!consultations.includes("consultation-payment-note")) {
  consultations = consultations.replace('</strong></article></div></section><section class="content-section"><div class="shell content-grid">', '</strong></article></div><p class="shell consultation-payment-note">Non remboursées par la CPAM, les consultations peuvent être prises en charge par votre mutuelle ; règlement par carte, chèque ou espèces.</p></section><section class="content-section"><div class="shell content-grid">');
}
let faqCount = 0;
if (!consultations.includes("faq-answer-card")) {
  consultations = consultations.replace(/<details class="info-card"><summary><strong>(.*?)<\/strong><\/summary><p style="margin-top:1rem;margin-bottom:0">(.*?)<\/p><\/details>/g, (_, question, answer) => {
    faqCount += 1;
    return `<article class="info-card faq-answer-card"><h3>${question}</h3><p>${answer}</p></article>`;
  });
  if (faqCount !== 3) throw new Error(`Nombre inattendu de FAQ : ${faqCount}`);
}
await write("consultations/index.html", consultations);

const digestifPath = "champs-action/systeme-digestif/index.html";
await write(digestifPath, (await read(digestifPath)).replaceAll("maladie coeliaque", "maladie cœliaque"));

const template = await read(digestifPath);
const mainStart = template.indexOf('<main id="contenu">');
const mainEnd = template.indexOf("</main>", mainStart) + 7;
const prefix = template.slice(0, mainStart);
const suffix = template.slice(mainEnd);
const definitionPrefix = prefix.replaceAll('href="../"', 'href="../../champs-action/"');
const definitionSuffix = suffix.replaceAll('href="../"', 'href="../../champs-action/"');

for (const topic of topics) {
  const description = `${topic.definition} Découvrez les repères utiles et le rôle de l’accompagnement nutritionnel.`;
  let head = definitionPrefix
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(topic.title)} | Geneviève Nutrition</title>`)
    .replace(/<meta name="description" content="[^"]*"\/>/, `<meta name="description" content="${escapeHtml(description)}"/>`)
    .replace(/<link rel="canonical" href="[^"]*"\/>/, `<link rel="canonical" href="https://www.genevievenutrition.fr/definitions/${topic.slug}"/>`)
    .replace(/<meta property="og:title" content="[^"]*"\/>/, `<meta property="og:title" content="${escapeHtml(topic.title)}"/>`)
    .replace(/<meta property="og:description" content="[^"]*"\/>/, `<meta property="og:description" content="${escapeHtml(description)}"/>`)
    .replace(/<meta property="og:url" content="[^"]*"\/>/, `<meta property="og:url" content="https://www.genevievenutrition.fr/definitions/${topic.slug}"/>`)
    .replace(/<meta name="twitter:title" content="[^"]*"\/>/, `<meta name="twitter:title" content="${escapeHtml(topic.title)}"/>`)
    .replace(/<meta name="twitter:description" content="[^"]*"\/>/, `<meta name="twitter:description" content="${escapeHtml(description)}"/>`);
  const related = topics.filter((item) => item.category === topic.category && item.slug !== topic.slug).slice(0, 4);
  const breadcrumb = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: "https://www.genevievenutrition.fr/" },
    { "@type": "ListItem", position: 2, name: "Définitions", item: "https://www.genevievenutrition.fr/champs-action" },
    { "@type": "ListItem", position: 3, name: topic.title }
  ] };
  const main = `<main id="contenu"><script type="application/ld+json">${JSON.stringify(breadcrumb)}</script><nav class="breadcrumb shell" aria-label="Fil d’Ariane"><ol><li><a href="../../">Accueil</a></li><li><a href="../../champs-action/">Champs d’action</a></li><li><span aria-current="page">${escapeHtml(topic.title)}</span></li></ol></nav><section class="page-hero definition-hero"><div class="shell page-hero-inner"><span class="eyebrow">Définition simple · ${escapeHtml(topic.category)}</span><h1>${escapeHtml(topic.title)}</h1><p>${escapeHtml(topic.definition)}</p></div></section><section class="content-section"><div class="shell definition-grid"><article class="definition-card"><span class="eyebrow">À retenir</span><h2>Les repères essentiels</h2><ul class="definition-points">${topic.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul></article><article class="definition-card"><span class="eyebrow">Accompagnement</span><h2>Le rôle de la diététique</h2><p>${escapeHtml(topic.role)}</p><p class="notice">Cette page informe sans remplacer un diagnostic ni un avis médical. En cas de symptômes, parlez-en à votre médecin.</p><a class="definition-source text-link" href="${topic.sourceHref}" target="_blank" rel="noopener noreferrer">Source : ${escapeHtml(topic.sourceLabel)} <span aria-hidden="true">↗</span></a><div class="button-row"><a class="button" href="../../champs-action/${topic.area}/">Voir l’accompagnement associé</a><a class="button button-ghost" href="../../consultations/">Voir les consultations</a></div></article></div>${related.length ? `<div class="shell definition-related"><span class="eyebrow">Dans le même thème</span><div class="definition-bubbles">${related.map((item) => `<a href="../${item.slug}/">${escapeHtml(item.label)}</a>`).join("")}</div></div>` : ""}</section></main>`;
  await write(`definitions/${topic.slug}/index.html`, head + main + definitionSuffix);
}

let css = await readFile(cssPath, "utf8");
if (!css.includes("/* Health definitions and consultation guidance */")) {
  const additions = `\n/* Health definitions and consultation guidance */\n.tag-row span,.tag-row a{border:1px solid #d9cdb8;border-radius:999px;padding:.35rem .65rem;font-size:.82rem;text-decoration:none;transition:background .18s,color .18s,transform .18s}.tag-row a:hover,.tag-row a:focus-visible{background:var(--green-950);color:var(--beige-50);transform:translateY(-2px)}.action-card-title-link{color:inherit;text-decoration:none}.action-card-title-link:focus-visible{outline:2px solid currentColor;outline-offset:.25rem}.action-section-credential{max-width:49rem;margin-top:1rem;color:#f2eadc;font-size:clamp(.9rem,1.3vw,1.02rem);line-height:1.65}.consultation-app-banner{display:flex;align-items:center;gap:1rem;margin-bottom:clamp(1.4rem,3vw,2.2rem);padding:1rem clamp(1rem,3vw,1.5rem);border:1px solid #2b574638;border-radius:1.15rem;background:linear-gradient(105deg,#fffaf2,#e9dfcc);box-shadow:0 14px 34px #22483a12}.consultation-app-banner p{margin:0;color:var(--green-950);font-size:clamp(1rem,1.6vw,1.18rem)}.consultation-app-mark{display:grid;place-items:center;flex:0 0 2.5rem;width:2.5rem;height:2.5rem;border-radius:.8rem;background:var(--green-950);color:var(--beige-50);font-family:Georgia,serif;font-size:1.35rem;font-style:italic}.consultation-payment-note{max-width:78rem;margin-top:1.25rem;margin-bottom:0;color:var(--green-800);font-size:.92rem;line-height:1.6}.faq-answer-card h3{margin:0 0 .65rem;font-size:clamp(1.05rem,1.8vw,1.25rem)}.faq-answer-card p{margin:0;color:var(--ink-700);line-height:1.7}.definition-hero{background:linear-gradient(145deg,var(--beige-50),var(--beige-100))}.definition-hero .page-hero-inner{max-width:920px}.definition-grid{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:clamp(1rem,3vw,2rem);align-items:start}.definition-card{border:1px solid #d9cdb8;border-radius:1.3rem;background:#fff;padding:clamp(1.35rem,3vw,2.1rem);box-shadow:0 18px 45px #22483a0d}.definition-card h2{font-size:clamp(1.65rem,3vw,2.35rem);margin-bottom:1rem}.definition-card p,.definition-card li{line-height:1.75}.definition-points{display:grid;gap:.7rem;padding-left:1.2rem}.definition-source{display:inline-flex;margin-top:1rem;font-weight:700}.definition-related{margin-top:clamp(2rem,5vw,4rem)}.definition-bubbles{display:flex;flex-wrap:wrap;gap:.65rem;margin-top:1rem}.definition-bubbles a{border:1px solid #d9cdb8;border-radius:999px;padding:.55rem .85rem;background:#fff;text-decoration:none}.definition-bubbles a:hover{background:var(--green-950);color:#fff}@media(max-width:900px){.definition-grid{grid-template-columns:1fr}.consultation-app-banner{align-items:flex-start}}\n`;
  css = css.replace("/*# sourceMappingURL=", additions + "/*# sourceMappingURL=");
}
if (!css.includes("body{overflow-x:clip}")) {
  css = css.replace("/* Health definitions and consultation guidance */", "body{overflow-x:clip}\n/* Health definitions and consultation guidance */");
}
await writeFile(cssPath, css, "utf8");

console.log(`Updated consultation guidance and generated ${topics.length} definition pages.`);
