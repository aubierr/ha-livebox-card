# Livebox TV Card

Carte Lovelace pour Home Assistant qui pilote le **décodeur TV UHD Orange** via l'intégration
[liveboxtvuhd](https://github.com/AkA57/liveboxtvuhd).

- En-tête avec le **programme en cours** (visuel EPG, titre, saison/épisode, barre de progression en direct)
- **Changement de chaîne** depuis une liste recherchable (grille ou liste), avec **favoris** et **chaînes récentes**
- Contrôles : marche/arrêt, chaîne +/−, lecture/pause, volume +/−, muet
- **Télécommande** intégrée (croix directionnelle, OK, retour, menu, guide, VOD, retour/avance rapide, enregistrement)
- **Pavé numérique** : tapez `6` → M6, la chaîne est reconnue et sélectionnée automatiquement
- Mise à jour optimiste : la chaîne choisie s'affiche tout de suite, puis l'entité est rafraîchie (l'intégration n'interroge le décodeur que toutes les 30 s)
- Éditeur visuel, thèmes clair/sombre

## Installation

### HACS (dépôt personnalisé)
1. HACS → ⋮ → *Dépôts personnalisés* → ajoutez l'URL de ce dépôt, catégorie **Dashboard**.
2. Installez **Livebox TV Card**, puis rechargez le navigateur.

### Manuelle
1. Copiez `livebox-tv-card.js` **et le dossier `logos/`** dans `config/www/` :
   ```
   config/www/livebox-tv-card.js
   config/www/logos/tf1-fr.png …
   ```
2. *Paramètres → Tableaux de bord → ⋮ → Ressources* → ajoutez `/local/livebox-tv-card.js` (type **Module JavaScript**).
3. Rechargez le navigateur (Ctrl+F5).

La carte cherche les logos dans le dossier `logos/` situé à côté du fichier `.js`. S'ils n'y sont pas
(par exemple si HACS n'a installé que le fichier `.js`), elle les charge automatiquement depuis Internet.
Pour les ranger ailleurs, utilisez `logo_path`, par ex. `logo_path: /local/livebox-logos/`.

## Configuration

Minimale :

```yaml
type: custom:livebox-tv-card
entity: media_player.livebox_salon
```

Complète :

```yaml
type: custom:livebox-tv-card
entity: media_player.livebox_salon
remote_entity: remote.livebox_salon   # auto-détectée (même appareil) si absente
name: Salon
default_panel: none                   # none | channels | remote | keypad
channel_layout: grid                  # grid | list
list_height: 340
show_artwork: true
show_progress: true
show_volume: true
show_remote: true
show_keypad: true
hide_guide: false                     # masque « 0. GUIDE TV »
close_on_select: true
builtin_logos: true                   # logos réels des chaînes
favorites: [1, 2, 3, 5, 6, "ARTE"]    # favoris initiaux (numéro ou nom)
logo_path: /local/logos/              # dossier des logos intégrés (défaut : logos/ à côté de la carte)
logo_template: "/local/mes-logos/{slug}.png"
logos:
  MIEUX: /local/mes-logos/mieux.png
  "6": /local/mes-logos/m6.png
```

| Option | Défaut | Description |
| --- | --- | --- |
| `entity` | **obligatoire** | Le `media_player` de l'intégration liveboxtvuhd |
| `remote_entity` | auto | L'entité `remote` du décodeur (télécommande et pavé numérique) |
| `name` | nom de l'entité | Titre affiché |
| `default_panel` | `none` | Panneau ouvert au chargement |
| `channel_layout` | `grid` | Affichage des chaînes en grille de logos ou en liste |
| `list_height` | `340` | Hauteur max. (px) de la liste des chaînes |
| `show_artwork` | `true` | Visuel du programme en fond d'en-tête |
| `show_progress` | `true` | Barre de progression du programme |
| `show_volume` | `true` | Boutons volume / muet |
| `show_remote` | `true` | Bouton télécommande |
| `show_keypad` | `true` | Bouton pavé numérique |
| `hide_guide` | `false` | Masquer l'entrée « GUIDE TV » |
| `close_on_select` | `true` | Fermer la liste après avoir choisi une chaîne |
| `builtin_logos` | `true` | Utiliser les logos intégrés |
| `logo_path` | `logos/` à côté de la carte | Dossier contenant les logos intégrés |
| `favorites` | `[]` | Favoris initiaux (numéros ou noms) |
| `logos` | `{}` | Logos par nom, numéro ou source (`"1. TF1"`) |
| `logo_template` | – | Modèle d'URL : `{slug}` (`france-2`, `canal-plus`), `{name}`, `{number}` |

### Logos des chaînes
La carte intègre les **vrais logos** de 245 des 247 chaînes de la liste Orange France, stockés **en local** dans
le dossier [`logos/`](logos) (198 fichiers, 3,5 Mo, 256 px max) :
- 156 fichiers viennent du dépôt libre [tv-logo/tv-logos](https://github.com/tv-logo/tv-logos) ;
- 42 viennent de la base [iptv-org](https://github.com/iptv-org/database) (images imgur, Wikimedia, ibb)
  et de [picons](https://github.com/picons/picons) (Trace Tropical).

Plusieurs chaînes partagent un fichier (les décrochages régionaux utilisent le logo France 3, les beIN Sports Max le
même logo). Les logos trop sombres sont affichés sur fond clair. **Mieux** et **Marmite TV** n'ont de logo dans aucune
source ouverte : elles gardent un badge coloré.

Ordre de priorité : `logos` → `logo_template` → logo local → même logo en ligne → badge.
Pour vos propres images, déposez-les par ex. dans `config/www/mes-logos/` et utilisez
`logo_template: /local/mes-logos/{slug}.png` ou `logos:` pour quelques chaînes.
`builtin_logos: false` désactive les logos intégrés.

Pour retélécharger les logos (après modification de la table `CHANNEL_LOGOS` de la carte) :
`python tools/fetch_logos.py .` (nécessite Pillow). `test/logos.html` affiche la planche des logos en ligne.

### Favoris et récentes
Touchez l'étoile d'une chaîne pour l'ajouter aux favoris. Favoris et récentes sont mémorisés dans le navigateur
(par appareil). La liste `favorites` de la configuration sert de point de départ tant qu'aucun favori n'a été modifié.

## Astuces
- Dans la recherche, **Entrée** sélectionne le premier résultat ; tapez un numéro (`40`) ou un nom (`canal`).
- Le pavé numérique valide tout seul après 2 s. Si le numéro n'est pas dans la liste, les chiffres sont envoyés à la télécommande.
- Le bouton d'alimentation envoie `turn_on` si le décodeur est éteint et `turn_off` sinon (la touche POWER de la box est une bascule).
