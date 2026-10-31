# TD 3 — Logarithmes, exponentielles et trigonométrie

Présentation interactive en français du TD no 3 de Mathématiques 1 (EC 101-1-17, 2026–2027), feuille de F. Marotte.

[Ouvrir la présentation](https://malek452.github.io/td3-fonctions/) · [Corrigé imprimable](https://malek452.github.io/td3-fonctions/handout/)

## Contenu

Les 7 exercices et leurs 15 questions sont traités : propriétés des logarithmes, équations et inéquations logarithmiques, changement de variable avec l'exponentielle, tableaux de signes et trigonométrie. Chaque résolution précise les conditions d'existence, le domaine de définition, les transformations justifiées et l'ensemble des solutions. Les rappels et les figures sont répartis dans le parcours.

Le cours joint « Chapitre 3 – Limites et continuité » inspire les repères graphiques et les rappels de croissance de ln et exp. Son thème principal diffère du TD. Les courbes et les cercles ont été redessinés pour cette présentation ; ils ne sont pas des captures des pages du cours.

## Animations des opérations

Les transformations présentent leurs rôles mathématiques : le facteur se distribue sur chaque terme ; une addition, une soustraction, une multiplication ou une division s'applique aux deux membres ; la réduction de termes semblables montre le calcul des coefficients. Les simplifications ciblent une sous-expression et indiquent leur justification. Les conditions de division et le changement de sens d'une inégalité sont explicités.

Le vocabulaire distingue les conditions d'existence, l'injectivité, la stricte croissance, la distributivité, la réduction et la factorisation. Chaque étape est accompagnée de sa justification ; une nouvelle hypothèse ou formule est annoncée séparément.

## Utilisation

- Choisir un exercice puis une question dans les menus.
- Avancer avec « Étape suivante », les flèches du clavier ou un glissement horizontal sur téléphone.
- Le menu des étapes permet d'aller directement à l'étude du domaine de définition, à un calcul ou à une conclusion.
- Utiliser le ralenti, le rejeu ou la réduction des animations selon les besoins.
- Le bouton plein écran facilite la projection. Le fond clair, les traits épais et les accents sombres améliorent la lecture.
- Le corrigé imprimable est accessible à `handout/`. L'impression du navigateur permet de l'enregistrer en PDF.

Les liens de questions sont stables, par exemple `#activity/td3-2b` et `#activity/td3-5c`. Aucun compte étudiant ni collecte de réponses.

## Développement

Dépôt indépendant [Malek452/td3-fonctions](https://github.com/Malek452/td3-fonctions), adapté du modèle [Atelier Présentations](https://github.com/Malek452/atelier-presentations). Node.js 24 requis.

```sh
npm ci
npm run validate
npm run dev
```

`npm run validate` exécute les régressions, la compilation TeX, TypeScript, Motion Canvas, le polycopié et le site. Les tests mathématiques propres au TD complètent la relecture indépendante des solutions et vérifient notamment les domaines, les tableaux de signes et les familles trigonométriques.

Le dépôt possède son propre historique, ses tests et son déploiement GitHub Pages. Le workflow construit uniquement cette présentation et publie `dist/` à chaque mise à jour de `main`. Les fichiers générés ne se modifient pas à la main.

## Sources et attribution

- F. Marotte, « Feuille TD no 3 », Mathématiques 1, 2026–2027 : énoncés fournis par l'enseignant.
- « Chapitre 3 – Limites et continuité », pages imprimées 29–42 : rappels et inspiration graphique.
- Modèle logiciel Atelier Présentations, licence MIT conservée dans `LICENSE`. Les droits sur les documents pédagogiques restent ceux de leurs auteurs.
