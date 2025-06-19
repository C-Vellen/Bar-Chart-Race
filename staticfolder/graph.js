//
//  Code permettant d'afficher le graphique interactif et la carte du monde
//

function displayGraph(
    mode,
    light,
    topN,
    lang,
    feature,
    yearStart,
    animTransitionDuration,
    loopDuration,
    slideTransitionDuration,
    shiftTransitionDuration,
    animTimer,
    autoLaunch,
) {

    /*
     * @param{string}  mode:                    mode : 'graph' (graphique interactif) ou 'video' (video)
     * @param{string}  lang:                    langue des légendes/labels (fr ou en)
     * @param{integer} topN:                    nombre de pays du palmares
     * @param{integer} light:                   mode clair (1) ou sombre(0)
     * @param{string}  feature:                 titre du graphique
     * @param{integer} yearStart:               année d'affichage initial
     * @param{integer} animTransitionDuration:  durée de la transition pour aller de l'affichage year à l'affichage year+1, pour l'animation
     * @param{integer} loopDuration:            pas de temps = durée pour la fonction async = durée de pause de l'image à year, pour l'animation
     * @param{integer} slideTransitionDuration: durée de la transition pour aller de l'affichage year à l'affichage year+1, pour le déplacement manuel slider
     * @param{integer} shiftTransitionDuration: durée de la transition quand on change de feature (avec le dropdown) ou de topN (avec l'input number)
     * @param{integer} animTimer:               durée de pause avant lancement auto de l'animation
     * @param{boolean} autoLaunch:              lancement auto de l'animation au démarrage (après pause animTimer)
     */

    //////////////////////////////////////////////////
    ///                                            ///
    ///  PARAMETRES D'INITIALISATION DU GRAPHIQUE  ///
    ///         POUR LE PREMIER AFFICHAGE          ///
    ///                                            ///
    //////////////////////////////////////////////////

    // jeu de données : 
    let data = dataSet[feature]

    // années extrêmes du graphe 
    const yearMin = Math.min(...Object.keys(dataSet.pop))
    const yearMax = Math.max(...Object.keys(dataSet.pop))
    // année d'arrêt de l'animation
    const yearEnd = yearMax
    // année courante (démarrage à yearStart)
    let year = yearStart


    //////////////////////////////////////////////////
    ///                                            ///
    ///  PARAMETRES DE MISE EN FORME DU GRAPHIQUE  ///
    ///                                            ///
    //////////////////////////////////////////////////

    // PARAMETRES GENERAUX
    // couleurs de fond et de contrast pour les modes dark(light=0) / light(light=1) :
    const backgroundColor = [
        "rgb(50,50,50)",        // fond mode sombre 
        "rgb(230, 230, 230)"    // fond mode clair
    ]
    const supercontrastColor = [
        "rgb(250, 250, 250)",   // traits mode sombre fort contrast 
        "rgb(0,0,0)"            // traits mode clair fort contrast 
    ]
    const contrastColor = [
        "rgb(230, 230, 230)",   // traits mode sombre faible contrast 
        "rgb(70,70,70)"         // traits mode clair faible contrast 
    ]
    let bgColor = backgroundColor[light]
    let sctColor = supercontrastColor[light]
    let ctColor = contrastColor[light]

    // marges et limites taille du container (point d'arrêt) :
    const scrWBp = 700; // point d'arrêt largeur fenêtre
    const scrMinWidth = 360; // largeur min graphContainer
    const scrMaxWidth = 1980; // largeur max graphContainer
    const scrHBp = 700; // point d'arrêt hauteur graphContainer

    // mode graphique ou video ? Coeft de mode pour calcul hauteur upperheader et footer (non affichés en mode video)
    const modeCoef = (mode == 'video') ? 0 : 1

    // paramètres pour le calcul de rangeY en fonction de la hauteur de fenetre disponible
    const upperheaderHeightMin = (4 + 33 + 4) * modeCoef // hauteur upperheader [margin.top+h+margin.bottom] écran max-width:700px
    const upperheaderHeightMax = (5 + 39 + 5) * modeCoef // hauteur upperheader
    const titleheaderHeightMin = 45 // hauteur titleheader [margin.top+h+margin.bottom] écran max-width:700px
    const titleheaderHeightMax = 56 // hauteur titleheader
    const headerHeightMin = upperheaderHeightMin + titleheaderHeightMin
    const headerHeightMax = upperheaderHeightMax + titleheaderHeightMax
    let headerHeight = null
    // ... corrections pour occuper 100% de la fenêtre :
    const bottomMarginMin = 25
    const bottomMarginMax = 20
    let bottomMargin = null


    // taille de police
    const fontSizeMin = 12
    const fontSizeMax = 15
    let fontSize = null

    // marges du container principal svgSelection :
    const svgMarginMin = { top: 40, right: 55, bottom: 10, left: 50 };
    const svgMarginMax = { top: 50, right: 60, bottom: 10, left: 80 };
    let svgMargin = null

    // PARAMETRES BARS
    // pas hauteur entre deux colonnes du graphique:
    const interColMin = 20; // pas mini entre deux colonnes
    const interCol = 40; // pas entre deux colonnes

    // ratio interstices/pas des colonnes :
    const padInner = 0.2 // espacement entre 2 colonnes (0 : colonnes se touchent, 1: espaces se touchent 

    const barMarginMin = 5  // marges left/right pour les labels des bars
    const barMarginMax = 10 // marges left/right pour les labels des bars
    let barMargin = null

    const flagShiftMin = 5  // décalage du drapeau vers la droite (espace x entre flag et bar
    const flagShiftMax = 8
    let flagShift = null
    let flags = null // initialisation de la liste des drapeaux, pour les tooltips


    // PARAMETRES SLIDER
    // dimensions du slider :
    const rRunnerMin = 14 // rayon mini du runner (bouton)
    const rRunnerMax = 20 // rayon maxi du runner (bouton)
    let rRunner = rRunnerMax
    let svgSliderWidth = null
    let yMode = false           // devient true quand on active le slider pour faire varier year. Permet de controler les events
    const distticks = 100 // distance en pixels entre 2 ticks, pour le slider

    // position du runner :
    let pointerX = null
    let shiftX = null

    // palette de couleurs du slider :
    const panelColor = {
        "fill": "rgb(150, 150, 150)",    // fond flèches de zoom et bouton de slider
        "hoverFill": "rgb(200, 200, 200)", // fond flèches de zoom et bouton de slider en hover
        "dragFill": "rgb(255, 0, 0)",  // fond flèches de zoom et bouton de slider en dragage
        "dragStop": "rgb(200, 100, 100)"
    }

    // RANGE POUR LES AXES 
    let rangeYear = null
    let rangeX = null
    let rangeY = null

    // Paramètres de controle de la marge droite, (=espace à droite de la barre la plus longue) afin d'avoir l'espace 
    // nécessaire et suffisant pour afficher les valueLabel par ex : 1 234 (15%)
    // --> dépendant du feature (les valeurs de pop sont plus longues que les valeurs de co2_pc)
    const marginCoef = {
        "pop": 2.2,
        "co2": 1.55,
        "bCco2": 1.55,
        "rCco2": 1.55,
        "co2_pc": 1.2,
        "Cco2_pc": 0.8,
    }
    // --> dépendant de la taille de police : (plus la police est grosse, plus il faut d'espace) :
    const xMarginMin = 1.0 // coef multiplicateur de la marge à droite  
    const xMarginMax = 1.15 //
    let xMargin = null

    // Paramètre de positionnement et de mise à l'échelle de la carte du monde
    const wMap = 2000 // largeur initiale de la carte en px
    const hMap = 857  // hauteur initiale de la carte en px

    const maxScaleRatio = 0.7 // % réduction max de la carto pour les features non "per capita"
    const intScaleRatio = 0.5 // % réduction inter de la carto pour les features "per capita"
    const minScaleRatio = 0.4 // % réduction min de la carto pour les features "per capita"

    const Nmin = 6 // nombre de pays affichés en dessous duquel on n'affiche plus la carto

    const widthHeightRatioMax = 2.6 // ratio largeur/hauteur max pour la carte
    const widthHeightRatioMin = 1.7 // ratio largeur/hauteur min pour la carte
    let wCarto = null   // largeur de la carte affichée en px
    let hCarto = null   // hauteur de la carte affichée en px
    let xCartoTranslate = null  // coord x origine de la carte affichée en px
    let yCartoTranslate = null  // coord y origine de la carte affichée en px
    let xCartoScale = null  // % de réduction de la largeur de la carte affichée
    let yCartoScale = null  // % de récuction de la hauteur de la carte affichée
    // Paramètres de colorisation de la carte
    const darkColorRate = 2.0 // taux d'assombrissement des couleurs des pays du top20
    const lightColorRate = 0.3 // taux d'éclaircissement des couleurs des pays de la carte


    ///////////////////////////////
    ///                         ///
    ///  FONCTIONS UTILITAIRES  ///
    ///                         ///
    ///////////////////////////////

    // === paramètres graphiques liés à la dimension de la fenêtre ===
    function viewport() {
        // calcul des paramètres d'affichage (marges, taille de police, échelle des axes,...)
        // en fonction des dimensions de la fenêtre
        let w = Math.min(Math.max(scrMinWidth, window.innerWidth), scrMaxWidth)
        let h = window.innerHeight

        if (w <= scrWBp) {
            svgMargin = svgMarginMin
            headerHeight = headerHeightMin
            fontSize = fontSizeMin
            xMargin = xMarginMin
            barMargin = barMarginMin
            flagShift = flagShiftMin
            rRunner = rRunnerMin
            bottomMargin = bottomMarginMin

        } else if (w > scrWBp) {
            svgMargin = svgMarginMax
            headerHeight = headerHeightMax
            barMargin = barMarginMax
            flagShift = flagShiftMax
            rRunner = rRunnerMax
            bottomMargin = bottomMarginMax
            if (h <= scrHBp) {
                fontSize = fontSizeMin
                xMargin = xMarginMin
            } else if (h > scrHBp) {
                fontSize = fontSizeMax
                xMargin = xMarginMax
            }
        }
        // paramètres axes X et Y 
        rangeX = w - svgMargin.left - svgMargin.right * marginCoef[feature] * xMargin
        rangeY = topN * interCol

        // adaptation de rangeY à la hauteur de fenêtre : si la fenêtre est trop petite, on resserre
        // les colonnes, jusqu'à une certaine limite en deça de laquelle la barre de scroll apparait
        let hFooter = (mode == 'video') ? 0 : parseFloat(d3.select(".footer").style("height").replace("px", "")) // pas de footer en video
        hGraphContainer = headerHeight + (svgMargin.top + rangeY * (topN + 1) / topN + svgMargin.bottom) + rRunner * 4.5 + hFooter - bottomMargin
        if (hGraphContainer > h) {
            rangeY = Math.max(
                rangeY - (hGraphContainer - h),
                topN * interColMin
            )
        }

        // met à jour la hauteur de la fenêtre svg
        svgSelectionHeight = rangeY + svgMargin.top + svgMargin.bottom
        svgSelection.attr("height", svgSelectionHeight)

        // paramètres du slider :
        svgSliderWidth = w
        rangeYear = svgSliderWidth - svgMargin.left - svgMargin.right - rRunner
    }

    // === Fonctions de mise en forme ===

    // séparateur de milliers :
    const sepMilliers = (k) => {
        if (typeof (k) == "number") { k = k.toFixed(0).toString() }
        let K = ""
        for (let i = 0; i < k.length; i++) {
            K += k[i]
            if (((k.length - 1 - i) % 3 == 0) && (k.length - 1 != i)) { K += ' ' }
        }
        return K
    };

    // mise en forme des labels
    function labelFormat(texte, description) {
        // formatte le texte contenu dans svg en le décomposant en tspan
        // et en appliquant les styles (indice, exposant,...)
        const Dy = 2 // décalage pour indice / exposant
        const regex = /<{1}\/?([a-z]+)>{1}/g;
        const parseList = texte.split(regex);
        description.text("");
        let dy = 0;
        for (let i = 0, l; l = parseList[i]; i++) {
            if (l == "sup") {
                dy += -Dy
                description.append("tspan").text(parseList[i + 1]).attr("dy", `${dy}px`).attr("font-size", "0.6em").attr("fill", "red");
                i++; i++;
            }
            else if (l == "sub") {
                dy += Dy
                description.append("tspan").text(parseList[i + 1]).attr("dy", `${dy}px`).attr("font-size", "0.6em");
                i++; i++;
            }
            else {
                dy = -dy
                description.append("tspan").text(l).attr("dy", `${dy}px`).attr("font-size", "1.0em");
            };
        };
    };

    // extraction du code, country, continent du data = { year:[ {country:value}, ...
    const country = k => Object.keys(k)[0] // nom du code pays
    const value = v => Object.values(v)[0] // valeur
    const get_palmares = year => {
        if (year >= yearMin & year <= yearMax) {
            return data[year].map(c => country(c))
        } else { return Array() }
    }
    // extraction des valeurs globales (monde entier) pour les émissions
    const worldValue = y => {
        if (feature.includes("_pc")) { //si émission / personne on ne peut pas faire la somme globale
            return null
        } else {
            return dataSetContinents[feature][year].filter(
                x => Object.keys(x).includes('WLD'))[0]['WLD']
        }
    }
    // calculs de pourcentages pour affichage dans les valeurs / labels
    const pourcent = (u, v, V) => {
        // détermine le label à afficher : 
        // - si feature = sth_pc ("per capita") : % de l'évolution / année n-1
        // - si feature = sth ("not per capita") : % du total modial
        // if (feature.includes("_pc")) { 
        if (feature == "co2_pc") {
            return pourcentEvolution(u, v)
        } else if (!feature.includes("_pc")) {
            return pourcentTotal(v, V)
        } else {
            return ""
        }
    }
    const pourcentEvolution = (u, v) => {
        // calcul et mise en forme du % entre 2 valeurs (affichage % en bout de bar)
        // Calcul du pourcentage :
        if (u === 0) {
            return "(-%)"
        } else {
            return `(${((u < v) ? '+' : '') + parseFloat((v - u) / u * 100).toFixed(1)} %)`
        }
    }
    const pourcentTotal = (v, V) => {
        // calcul et mise en forme du % de v sur le total V (affichage % en bout de bar)
        if (V === 0) {
            return "(-%)"
        } else {
            return `(${parseFloat(v / V * 100).toFixed(1)} %)`
        }
    }

    const currentTransition = (td) => d3.transition()
        .duration(td)
        .ease(d3.easeLinear)

    // === Fonctions de colorisation de la carte du monde pour le top 20 (couleurs foncées selon la valeur) ===

    // Colorisation d'un pays de la carte, selon son continent, avec assombrissement
    // ou éclaircissement des couleurs et transition
    function colorMap(countryCode, lightDarkCoef, td) {
        //const carto = d3.select("#carto")
        const continentColor = d3.color(continentId[countryId[countryCode].code].color)
        const newColor = continentColor.brighter(lightDarkCoef)
        carto.selectAll(`.${countryCode}`).each(function () {
            d3.select(this)
                .transition().duration(td)
                .style("fill", newColor)
        })
    }

    // Colorisation initiale de tous les pays de la carte, selon leur continent (avec éclaircissement des couleurs)
    function initialColorMap(td) {
        const carto = d3.select("#carto")
        carto.selectAll("path").each(function () {
            continentCode = d3.select(this).attr('class').slice(0, 3)
            const continentColor = d3.color(continentId[continentCode].color)
            const newColor = continentColor.brighter(lightColorRate)
            d3.select(this)
                .transition().duration(td)
                .style("fill", newColor)
        })
    }

    // === Fonctions de calcul des échelles ===

    function xScaleGenerator(year) {
        // retourne la fonction permettant de convertir la valeur x en pixel :
        //let vw = window.innerWidth;
        let xMin = 0
        let xMax = d3.max(data[year], function (d, i) { return value(d) })
        return d3.scaleLinear()
            //.domain([xMin, xMax*(1+xMargin)])
            .domain([xMin, xMax])
            .range([0, rangeX]);
    };

    function yScaleGenerator(year) {
        // retourne la fonction permettant de convertir la catégorie y en pixel :
        // graphDisplay(); // définit interCol, padInner et svgMargin.left en fonction de l'écran / container
        return d3.scaleBand()
            .domain(data[year].map(c => country(c)))
            .range([0, rangeY * data[year].length / topN])
            .paddingInner(padInner)
            .paddingOuter(0.2)
            .align(0.5);
    };

    function yearScaleGenerator() {
        // retourne la fonction permettant de convertir la valeur year en pixels sur le slider
        return d3.scaleLinear()
            .domain([yearMin, yearMax])
            .range([0, rangeYear])
    }

    function playPauseButton(d, s, motion) {
        // path d'une interface play pause :
        // flèche "play" triangle équilatéral de base d et avec des angles arrondis de rayon s
        // double barre "pause" de hauteur d et avec des angles arrondis de rayon s
        // transition possible entre flèche et double barre
        const arrow = `M0,${-d / 4}             
            Q0,${-d / 4} 0,${-d / 4}                        
            L${-d * 0.433 + s * 1.5},${-d / 2 + s * 0.866} 
            Q${-d * 0.433},${-d / 2} ${-d * 0.433},${-d / 2 + s * 1.732} V${d / 2 - s} 
            Q${-d * 0.433},${d / 2} ${-d * 0.433 + s * 1.5},${d / 2 - s * 0.866}  
            L0,${d / 4}  
            Q0,${d / 4} 0,${d / 4} z

            M0,${-d / 4}  
            Q0,${-d / 4} 0,${-d / 4}                        
            L${d * 0.433 - s * 1.5},${-s * 0.866} 
            Q${d * 0.433 - s},${-s * 0.577} ${d * 0.433 - s} 0
            V0
            Q${d * 0.433 - s},${s * 0.577} ${d * 0.433 - s * 1.5},${s * 0.866} 
            L0,${d / 4}  
            Q0,${d / 4} 0,${d / 4} z`
        const doublebar = `M${-d * 0.144},${-d / 2 + s} 
            Q${-d * 0.144}, ${-d / 2} ${-d * 0.144 - s},${-d / 2} 
            L${-d * 0.433 + s},${-d / 2}             
            Q${-d * 0.433},${-d / 2} ${-d * 0.433},${-d / 2 + s}       
            V${d / 2 - s} 
            Q${-d * 0.433},${d / 2} ${-d * 0.433 + s},${d / 2}              
            L${-d * 0.144 - s},${d / 2} 
            Q${-d * 0.144},${d / 2} ${-d * 0.144},${d / 2 - s}  z            

            M${d * 0.144},${-d / 2 + s} 
            Q${d * 0.144}, ${-d / 2} ${d * 0.144 + s},${-d / 2} 
            L${d * 0.433 - s},${-d / 2}             
            Q${d * 0.433},${-d / 2} ${d * 0.433},${-d / 2 + s}       
            V${d / 2 - s} 
            Q${d * 0.433},${d / 2} ${d * 0.433 - s},${d / 2}              
            L${d * 0.144 + s},${d / 2} 
            Q${d * 0.144},${d / 2} ${d * 0.144},${d / 2 - s}  z`
        return (motion) ? doublebar : arrow
    }

    ///////////////////////////////////////////////////////////
    ///                                                     ///
    ///  FONCTIONS DE MISE A JOUR DES ELEMENTS GRAPHIQUES   ///
    ///                                                     ///
    ///////////////////////////////////////////////////////////

    // Mise à jour de la barre de titre et du menu déoulant (pour le changement de langue)
    function titleheaderUpdate(titleheader) {
        Object.keys(dataSet).forEach(feat => {
            titleheader.select(".menu")
                .select(`#${feat}`)
                .html(dataSetUnits[feat].name[lang])
        })
        titleheader.select(".selected").html(dataSetUnits[feature].name[lang])
        return titleheader
    }

    // met à jour l'année
    function yearDisplayUpdate(year) {
        titleheader.select("#yeardisplay").select("span").html(year)
    }

    // commutation des couleurs mode clair / sombre
    function darkOrLightMode() {
        bgColor = backgroundColor[light]
        sctColor = supercontrastColor[light]
        ctColor = contrastColor[light]

        graphContainer.style("background-color", bgColor)
        titleheader.selectAll(".select").style("background", ctColor).style("color", bgColor)
        titleheader.selectAll(".caret").style("border-top-color", bgColor)
        titleheader.selectAll(".menu").style("background", ctColor).style("color", bgColor).style("box-shadow-color", ctColor)
        titleheader.selectAll(".menu li").style("background", ctColor)
        titleheader.selectAll(".menu .active").style("background", () => (light) ? "rgb(100, 100, 100)" : "rgb(255, 255, 255)")
        titleheader.select("#yeardisplay").style("color", ctColor)

        graphContainer.selectAll(".bgcolor-fill").style("fill", bgColor)
        graphContainer.selectAll(".bgcolor-stroke").style("stroke", bgColor)
        graphContainer.selectAll(".sctcolor-fill").style("fill", sctColor)
        graphContainer.selectAll(".sctcolor-stroke").style("stroke", sctColor)
        graphContainer.selectAll(".ctcolor-fill").style("fill", ctColor)
        graphContainer.selectAll(".ctcolor-stroke").style("stroke", ctColor)

        //carto.selectAll("path").style("stroke", sctColor)
        footer.selectAll("p").style("color", sctColor)
        footer.selectAll("li").style("color", sctColor)
    }

    // Mise à jour d'une bar qui a été créée :
    function barUpdate(c, r, v, u, WV, x, y, dy, td) {
        /* 
         * @param{string}   c: code alpha3 du pays (ex: "FRA")
         * @param{integer}  r: rang du pays (entre 1 et topN) 
         * @param{float)    v: valeur à afficher (ex 1234.567)
         * @param{float)    u: valeur de l'année -1 (pour calcul du %)
         * @param{float)    WV: valeur totale monde de l'année (pour calcul du %)
         * @param{integer}  x: prop. width = longueur de la bar en px 
         * @param{integer}  y: prop. y = position y de la bar en px 
         * @param{integer}  dy: prop. height = hauteur de la bar en px 
         * @param{integer}  td: durée de l'animation entre chaque année, en ms 
         */
        const gb = svgSelection.select("#bars").select(`#${c}`)
        const gl = svgSelection.select("#labels").select(`#${c}`)
        // mise à jour bar (décalage vers le bas si rang > topN pour masquage
        gb.transition(currentTransition(td))
            .attr("transform", `translate( 0, ${(r <= topN) ? y : y + (rangeY * 0.5) / topN} )`)
        gb.select("rect")
            .attr("rx", dy / 5)
            .attr("ry", dy / 5)
            .attr("height", dy)
            .transition(currentTransition(td))
            .attr("width", x)

        // mise à jour label (décalage vers le bas si rang > topN pour masquage
        gl.transition(currentTransition(td))
            .attr("transform", `translate( 0, ${(r <= topN) ? y : y + (rangeY * 0.5) / topN} )`)
        // rang :
        gl.select(".rankingLabel")
            .text(r)
            .style("font-size", `${fontSize * 0.8}px`)
            .attr("x", `${barMargin}`)
            .attr("y", `${dy / 2}`)
            .attr("dominant-baseline", "middle")
        // texte nom du pays :
        if (gl.select(".countryLabel").node() == null) {
        }
        const countryLabelSize = gl.select(".countryLabel").node().getBBox().width
        let steadyEndAnchor = false
        const anchor = gl.select(".countryLabel").attr("text-anchor")
        const countryLabelLeftPosition = barMargin * 2 + fontSize * 0.5
        const countryLabelRightPosition = barMargin

        gl.select(".countryLabel")
            .style("font-size", `${(rangeY / topN > (interCol + interColMin) / 2) ? fontSize : fontSizeMin}px`)
            .attr("y", `${dy / 2}`)
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", () => {
                if (countryLabelSize < x - (countryLabelLeftPosition + countryLabelRightPosition)) {
                    steadyEndAnchor = (anchor == "end")
                    return "end"
                } else {
                    return "start"
                }
            })
            .transition(currentTransition(steadyEndAnchor ? td : 0))
            .attr("x", () => {
                if (countryLabelSize < x - (countryLabelLeftPosition + countryLabelRightPosition)) {
                    return x - barMargin
                } else {
                    return countryLabelLeftPosition
                }
            })
        // rectangle de masquage du text overflow :
        gl.select("rect")
            .attr("height", dy)
            .attr("width", rangeX - x)
            .transition(currentTransition(td))
            .attr("x", x)
        // valeur :
        gl.select(".valueLabel")
            //.text(`${sepMilliers(v)} (${pourcentEvolution(u,v)})`)
            //.text(`${sepMilliers(v)} (${pourcentTotal(v,WV)})`)
            .text(`${sepMilliers(v)} ${pourcent(u, v, WV)}`)
            .style("font-size", `${fontSize * 0.8}px`)
            .style("fill", sctColor)
            .attr("y", `${dy / 2}`)
            .attr("dominant-baseline", "middle")
            .transition(currentTransition(td))
            .attr("x", `${x + 10}`)
        // drapeau :
        gl.select(".flagLabel")
            .attr("transform", `translate(  ${-dy * 1.33 - flagShift}, 0)`)
            .select("svg")
            .attr("height", `${dy}`)
            .attr("width", `${dy * 1.33}`)
        // encadrement du drapeau :
        gl.select(".flagFrame")
            .attr("transform", `translate(  ${-dy * 1.33 - flagShift}, 0)`)
            .attr("height", `${dy}`)
            .attr("width", `${dy * 1.33}`)
            .style("fill", "none").attr("stroke", "#000").attr("stroke-width", "0.5px")
    }

    // Mise à jour des pays du palmares du barChart pour une année donnée :
    function barChartUpdate(year, xScale, yScale, transitionDuration) {
        const gb = svgSelection.select("#bars")
        const gl = svgSelection.select("#labels")
        gb.attr("transform", `translate( ${svgMargin.left} , ${svgMargin.top})`);
        gl.attr("transform", `translate( ${svgMargin.left} , ${svgMargin.top})`);
        const oldPalmares = get_palmares(year - 1)
        const currentPalmares = get_palmares(year)
        const futurPalmares = get_palmares(year + 1)

        // pays sortant et entrant dans le palmares :
        exitCountries = oldPalmares.filter(c => !currentPalmares.includes(c))
        newCountries = futurPalmares.filter(c => !currentPalmares.includes(c))
        allPalmares = currentPalmares.concat(exitCountries, newCountries)

        // creation des bars (sauf si elles existent déjà) et mise à jour :
        // affichage des pays du palmares courant :
        for (c of allPalmares) {
            if (gb.select(`#${c}`).empty()) { barCreate(svgSelection, c) }
            if (gl.select(`#${c}`).empty()) {
                labelCreate(svgSelection, c)
            }
        }
        // ... data de l'année précédente pour l'affichage des % d'évolution
        const dOld = data[(year > yearMin) ? year - 1 : year]  // !
        // ...

        // traitement des pays du palmares courant, et ceux qui viennent d'y entrer :
        for (let i = 0; i < data[year].length; i++) {
            d = data[year][i] // donnée {"FRA":1.234} d'un pays pour une année
            countryWasInPalmaresLastYear = ((year > yearMin) && (dOld.map(k => country(k)).includes(country(d))))

            // ... calcul valeur de l'année précédente pour l'affichage des %
            const vOld = () => {
                if (countryWasInPalmaresLastYear) {
                    return dOld.filter(k => (country(k) == country(d)))[0][country(d)]
                } else { return 0 }
            }
            // ... effacage de l'éventuel tooltip "nom du pays" qui sinon se retrouvait devant un drapeau ne lui correspondant pas.
            if (countryWasInPalmaresLastYear) {
                // si le rang du pays est différent de l'année précédente, alors le drapeau a bougé et il faut donc effacé le tooltip
                if (i != data[year - 1].map(k => Object.keys(k)[0]).indexOf(country(d))) {
                    tooltipHide(country(d))
                }
            }
            // ... mise à jour de la barre
            barUpdate(
                country(d),         // nom de code alpha3 du pays 
                i + 1,                // rang du pays 
                value(d),           // valeur à afficher
                vOld(),             // valeur précédente pour le calcul de %
                worldValue(year),   // valeur totale monde pour le calcul de %
                xScale(value(d)),   // longueur de la bar
                yScale(country(d)), // position de la bar (en hauteur)
                yScale.bandwidth(), // largeur de la bar
                transitionDuration  // paramètre d'animation (en ms)
            )
            // ... mise à jour colorisation des pays de la carte
            colorMap(
                country(d),                 // nom de code alpha3 du pays
                - darkColorRate * xScale(value(d) / rangeX), // paramètre d'assombrissement dépendant de la valeur
                transitionDuration         // paramètre d'animation pour changement couleur en fondu
            )
        }
        // traitement des pays qui vont entrer dans le palmares :
        for (c of exitCountries.concat(newCountries)) {
            barUpdate(
                c,                  // nom de code alpha3 du pays 
                0,                  // rang du pays 
                0,                  // valeur à afficher
                0,                  //
                0,                  //
                0,                  // longueur de la bar
                rangeY * (1 + 1 / topN),     // position de la bar en topN+1 : masqué hors champ sous le graphe
                yScale.bandwidth(), // largeur de la bar
                transitionDuration  // paramètre d'animation (en ms)
            )
        }
        // nettoyage des autres pays
        for (g of gb.selectAll(".bar")) {
            if (!allPalmares.includes(g.id)) {
                g.remove()
                // recolorisation initiale des pays sortant du palmares
                colorMap(
                    g.id,
                    lightColorRate,
                    transitionDuration
                )
            }
        }
        for (g of gl.selectAll(".label")) {
            if (!allPalmares.includes(g.id)) {
                g.remove()
            }
        }
    }

    // Mise à jour des axes x et y
    function axisUpdate(g, year, xScale, yScale, transitionDuration) {
        // trace et met à jour les axes x et y
        g.attr("transform", `translate( ${svgMargin.left} , ${svgMargin.top})`)
        const xAxisGenerator = d3.axisTop(xScale)
            .ticks(rangeX / distticks)
            .tickFormat(x => sepMilliers(x))
            .tickSizeOuter([0])
            .tickSizeInner(-[rangeY * (topN + 1) / topN])

        g.select("#xAxis")
            .transition(currentTransition(transitionDuration))
            .call(xAxisGenerator)
        g.select("#xAxis").selectAll(".tick").select("line")
            .attr("class", "bgcolor-stroke")
            .style("stroke", bgColor)
        g.select("#xAxis").selectAll(".tick").select("text")
            .attr("class", "sctcolor-fill")
            .style("fill", sctColor)
            .style("font-size", `${fontSize * 0.7}px`)
        g.select("#xAxis").select(".domain").remove()
        g.select("#xAxis").select(".textlabel").attr("x", rangeX)
            .style("font-size", `${fontSize * 0.8}px`)

        labelFormat(dataSetUnits[feature].unit[lang], g.select("#xAxis").select(".textlabel"))
    }

    // Mise à jour de la position (translate) et échelle (scale) de la carte du monde
    function cartoUpdate(td) {

        // largeur et hauteur de la zone graphique svgSelection sans les marges :
        const rangeW = Math.min(Math.max(scrMinWidth, window.innerWidth), scrMaxWidth) - svgMargin.left - svgMargin.right
        const rangeH = rangeY //+ svgMargin.bottom

        // paramètres carte :
        // ... calcul des dimensions w et h de la carte :
        let scaleRatio = (topN >= Nmin) ? (feature.includes('_pc') ? (intScaleRatio - minScaleRatio) * (topN - N) / (N - Nmin) - (maxScaleRatio - intScaleRatio) : 0) + maxScaleRatio : 0
        wCarto = scaleRatio * Math.min(rangeW, rangeH * widthHeightRatioMax)
        hCarto = scaleRatio * Math.min(rangeH, rangeW / widthHeightRatioMin)
        xCartoTranslate = svgMargin.left + rangeW - wCarto
        yCartoTranslate = svgMargin.top + rangeH - hCarto
        xCartoScale = wCarto / wMap
        yCartoScale = hCarto / hMap

        const carto = d3.select("#carto")
        carto.transition(currentTransition(td))
            .attr("transform", `translate(${xCartoTranslate}, ${yCartoTranslate}) scale(${xCartoScale}, ${yCartoScale})`)
        return carto
    }

    // Mise à jour du bouton pause / play
    function motionButtonUpdate(svg, inMotion) {
        const motionButton = svg.select("#motionbutton")
        const d = rRunner * 1.2
        const s = rRunner / 8// rayon adoucissant les angles

        motionButton.attr("transform", `translate(${svgMargin.left / 1.7}, ${rRunner * 1.8})`)
            // motionButton.attr("transform", `translate(${38}, ${rRunner * 1.8})`)
            .attr("stroke", ctColor).attr("stroke-width", "1px").style("fill", "none")
        motionButton.select("path")
            .style("fill", ctColor)
            .transition(currentTransition(200))
            .attr("d", `${playPauseButton(d, s, (inMotion || restartMotion))}`)

        motionButton.select("circle").attr("cx", 0).attr("cy", 0).attr("r", rRunner)
    }

    // Mise à jour du slider
    function sliderUpdate(svg, year, yearScale, transitionDuration) {
        // trace et met à jour le slider de type <svg> en fonction de yearScale et des paramètres liés à la taille d'écran :
        svg.attr("width", svgSliderWidth).attr("height", rRunner * 4.5)
        svg.select("#slideBloc").attr("transform", `translate( ${rRunner / 4 + svgMargin.left}, ${rRunner * 1.8} )`)
        svg.select("#touchZone").attr("x", -svgMargin.left)
        // barre du slider :
        svg.select("#fixBar")
            .attr("y", -rRunner / 8)
            .attr("height", rRunner / 4)
            .attr("rx", rRunner / 8).attr("ry", rRunner / 8)
            .style("stroke-width", rRunner / 30)
        svg.select("#moveBar")
            .attr("x", -rRunner / 4)
            .attr("y", -rRunner / 8)
            .attr("height", rRunner / 4)
            .attr("rx", rRunner / 8).attr("ry", rRunner / 8)
            .style("stroke-width", rRunner / 30)

        svg.select("#touchDisc").attr("r", rRunner * 2)
        svg.select("#button").attr("r", rRunner * 0.5)
        svg.select("#rim").attr("r", rRunner * 0.35)

        // postionnement du runner, sauf si on est en drag runner (dans ce cas c'est l'event pointermove qui pilote le positionnement)
        //if ( inMotion || !restartMotion ) { 
        if (!restartMotion) {
            setRunner(year, transitionDuration)
        }
        // axe et graduations :
        const yearAxisGenerator = d3.axisBottom(yearScale)
            .ticks(rangeYear / distticks)
            .tickFormat(year => year.toString())
            .tickSizeOuter(0)
        svg.select("#yearAxis")
            .call(yearAxisGenerator)
            .selectAll(".tick").select("line")
            .attr("y2", rRunner * 0.6)
            .attr("class", "sctcolor-stroke").style("stroke", sctColor)
        svg.select("#yearAxis")
            .selectAll(".tick").select("text").attr("y", rRunner * 0.8)
            .attr("class", "sctcolor-fill").style("fill", sctColor)
            .style("font-size", `${fontSize * 0.7}px`)
    }

    // Mise à jour du footer
    function footerUpdate(gr) {
        gr.select(".footer").style("margin-left", svgMargin.left / 2)
        gr.select(".footer-legend").html(graphLegend[feature][lang])
            .style("color", sctColor)
        gr.select(".footer-owidcitation").html(
            owidCitation[feature === "pop" ? "pop" : "co2"]
        ).style("color", sctColor)
        gr.select(".footer-underlyingcitation").html(
            underlyingCitation[feature === "pop" ? "pop" : (feature.includes("_pc") ? "co2_pc" : "co2")]
        ).style("color", sctColor)
    }


    /////////////////////////////////////////////////////////////
    ///                                                       ///
    ///  FONCTIONS D'INITIALISATION DES ELEMENTS GRAPHIQUES   ///
    ///                                                       ///
    /////////////////////////////////////////////////////////////

    // Création du bandeau supérieur (DarkMode / TOP N  / Lang)
    function upperheaderCreate(upperheader) {
        upperheader.select("#darkmode")
        upperheader.select("#topselect").attr("class", "noselect")
        upperheader.select("#langtoggle").select("#lang-flag-fr")
            .attr("transform", "translate(5, 0)")
            .html(function () { return countryId["FRA"].flag })
        upperheader.select("#langtoggle").select("#lang-flag-gb")
            .attr("transform", "translate(27, 0)")
            .html(function () { return countryId["GBR"].flag })
        upperheader.select("#langtoggle").select("#flag-icons-fr").attr("width", "18")
        upperheader.select("#langtoggle").select("#flag-icons-gb").attr("width", "18")
        return upperheader
    }

    // Création de la barre de titres et du menu déroulant :
    function titleheaderCreate(titleheader) {
        Object.keys(dataSet).forEach(feat => {
            titleheader.select(".menu").append("li")
                .attr("id", feat)
                .attr("class", (feat === feature) ? "active" : "")
                .html(dataSetUnits[feat].name[lang])
        })
        titleheader.select(".selected").html(dataSetUnits[feature].name[lang])
        return titleheader
    }

    // Création d'une bar :
    function barCreate(svg, c) {
        // créé une bar à l'inzaitialisation ou apparition d'un pays
        const g = svg.select("#bars")
        g.append("g")
            .attr("id", `${c}`)
            .attr("class", "bar")
            .attr("transform", `translate(0, ${rangeY * (1 + 1 / topN)})`) // bar positionnées en topN+1 position, masquée
            .append("rect")
            .attr("x", 0).attr("y", 0)
            .attr("width", 0)
            .style("fill", continentId[countryId[c].code].color)
            .style("opacity", 1.0)
    }

    // Création d'un label (nom pays + bar + valeur + drapeau + encadrement) ;
    function labelCreate(svg, c) {
        // créé un label à l'initialisation ou apparition d'un pays
        const g = svg.select("#labels")
        g.append("g")
            .attr("id", `${c}`)
            .attr("class", "label")
            .attr("transform", `translate(0, ${rangeY * (1 + 1 / topN)})`) // bar positionnées en topN+1 position, masquée
        g.select(`#${c}`).append("text")
            .attr("class", "rankingLabel")
        //.attr("class", "rankingLabel sctcolor-fill")
        g.select(`#${c}`).append("text")
            .attr("class", "countryLabel")
            //.attr("class", "countryLabel sctcolor-fill")
            .text(countryId[c].name[lang])
        g.select(`#${c}`).append("rect") // masquage du text overflow
            .attr("class", "bgcolor-fill")
            .style("fill", bgColor)
        g.select(`#${c}`).append("text")
            .attr("class", "valueLabel sctcolor-fill")
            .style("fill", sctColor)

        g.select(`#${c}`).append("g")
            .attr("class", "flagLabel")
            .attr("x", 0).attr("y", 0)
            .on("pointermove", (e) => {
                tooltipDisplay(e)
            })
            .on("pointerdown", (e) => {
                e.stopPropagation()
                tooltipDisplay(e)
            })
            .on("pointerleave", (e) => {
                const countryCode = e.currentTarget.parentNode.id
                setTimeout(() => tooltipHide(countryCode), 500)
            })
            .on("click", (e) => {
                e.stopPropagation()  // pour éviter de déclencher play (event sur svgSelection)
            })
            .html(function () { return countryId[c].flag })
        g.select(`#${c}`).append("rect")
            .attr("class", "flagFrame ctcolor-stroke")
            .attr("x", 0).attr("y", 0)
            .style("stroke", ctColor)
    }

    // Création des axes x et y
    function axisCreate(svg) {
        let axis = svg.append("g").attr("id", "axis")
        axis.append("g").attr("id", "xAxis")
            .append("text").attr("class", "textlabel sctcolor-fill")
            .style("font-weight", "bold")
            .attr("y", -20)
            .attr("text-anchor", "end");
        axis.append("g").attr("id", "yAxis")
        return axis
    }

    // Création d'un tooltip pour le nom du pays au survol d'un drapeau :
    function tooltipCreate(svg) {
        const tooltip = svg.append("g")
            .attr("class", "hoverflag")
            .style("transition", "opacity 0.5s")
            .style("opacity", 0)
        tooltip.append("rect").attr("class", "ctcolor-fill").attr("x", "0").attr("y", "0")
        tooltip.append("text").attr("class", "bgcolor-fill")
    }

    // Création de la carte du monde
    function cartoCreate(svg) {
        const carto = svg.append("g").attr("id", "carto")
        for (continentCode of Object.keys(worldMap)) {
            for (countryCode of Object.keys(worldMap[continentCode])) {
                carto.append("path")
                    .attr("class", `${continentCode} ${countryCode.slice(0, 3)}`)
                    .attr("d", worldMap[continentCode][countryCode])
                    .style("stroke", ctColor)
            }
        }
        //carto.style("visibility", "hidden")
        /*
        carto.append("rect")
            .attr("x", 0).attr("y",0)
            .attr("width", 2000).attr("height", 857)
            .style("fill", "none")
            .style("stroke", "#00f")
        */
        initialColorMap(0)
        return carto
    }

    // Création du bouton pause / play
    function motionButtonCreate(svg) {
        // créé un bouton de démarrage / pause de l'animation
        // de type <g> sous une division <svg> 
        const motionButton = svg.append("g")
            .attr("id", "motionbutton")
            .attr("class", "ctcolor-stroke")
            .attr("cursor", "pointer")
        motionButton.append("path").attr("class", "ctcolor-fill")
        motionButton.append("circle")
            .style("fill", "#000")
            .style("opacity", 0)
        return motionButton
    }

    // Création du slider sur l'échelle des ans
    function sliderCreate(svg) {
        // slider :
        const slider = svg.append("g").attr("id", "slideBloc")

        slider.append("g").attr("class", "nohighlight").attr("id", "yearAxis")
        slider.append("g").attr("class", "nohighlight").attr("id", "slideBar")
            .attr("cursor", "pointer")
        slider.select("#slideBar").append("rect")       // barre vide (toute la largeur de yearMin à yearMax)
            .attr("id", "fixBar").attr("class", "nohighlight ctcolor-stroke")
            .style("fill", panelColor.fill)
        slider.select("#slideBar").append("rect")       // barre de 0 au curseur, peut être colorisée pour marquer l'avancement
            .attr("id", "moveBar").attr("class", "nohighlight ctcolor-stroke")
            .style("fill", panelColor.fill)
            .style("transition", "fill 0.3s")

        // runner :
        slider.select("#slideBar").append("g").attr("id", "runner")
        slider.select("#runner").append("circle")
            .attr("id", "button")
            .attr("class", "nohighlight bgcolor-fill ctcolor-stroke")
            .style("stroke-width", 1)
        slider.select("#runner").append("circle")
            .attr("id", "rim")
            .style("transition", "fill 0.3s")
        slider.select("#runner").append("text")
            .attr("id", "currentyear")
            .attr("class", "sctcolor-fill noselect nohighlight")
            .attr("text-anchor", "middle")
            .style("transition", "opacity 0.3s")
            .style("opacity", 0.0)
        slider.select("#runner").append("circle")
            .attr("id", "touchDisc")
            .attr("class", "nohighlight")
            .style("opacity", 0.0)
        slider.select("#runner").selectAll("circle").attr("cx", 0).attr("cy", 0)
        return slider
    }

    // Création du footer avec legende et citations
    function footerCreate(gr) {
        f = gr.append("div").attr("class", "footer")
        f.append("p").attr("class", "footer-legend")
        const ul = f.append("ul").attr("class", "footer-citation")
        ul.append("li").attr("class", "footer-owidcitation")
        ul.append("li").attr("class", "footer-underlyingcitation")
        return f
    }

    // Création initiale du canevas html :
    function htmlCreate(year) {
        const graphContainer = d3.select("#graphcontainer").attr("class", "nohighlight")
        const svgSelection = graphContainer.append("svg").attr("class", "svgSelection")
        const svgSlider = graphContainer.append("svg").attr("class", "svgSlider")

        return {
            graphContainer: graphContainer,
            //  BANDEAU SUPERIEUR : mode sombre/top10/choix langue
            upperheader: upperheaderCreate(d3.select("#upperheader")),
            // EN-TETE : choix graphique / année
            titleheader: titleheaderCreate(d3.select("#titleheader")),
            // zone de graphique :
            svgSelection: svgSelection,
            bars: svgSelection.append("g").attr("id", "bars"),
            axis: axisCreate(svgSelection),
            labels: svgSelection.append("g").attr("id", "labels"),
            tooltips: tooltipCreate(svgSelection),
            carto: cartoCreate(svgSelection),
            // barre de lancement animation :
            svgSlider: svgSlider,
            motionButton: motionButtonCreate(svgSlider),
            slider: sliderCreate(svgSlider),
            // zone legend/citations :
            footer: footerCreate(graphContainer)
        }
    }

    //////////////////////////////////////////////////////////////
    ///                                                        ///
    ///         FONCTIONS ASYNCHRONE POUR LES ANIMATIONS       ///
    ///                                                        ///
    //////////////////////////////////////////////////////////////

    let inMotion = null
    let restartMotion = false
    let t0 = Date.now()


    // Lancement du bar chart :
    function launchTrace(year, transitionDuration) {
        yearDisplayUpdate(year)
        xScale = xScaleGenerator(year)
        yScale = yScaleGenerator(year)
        yearScale = yearScaleGenerator()
        axisUpdate(axis, year, xScale, yScale, transitionDuration)
        barChartUpdate(year, xScale, yScale, transitionDuration)
        motionButtonUpdate(svgSlider, inMotion)
        sliderUpdate(svgSlider, year, yearScale, transitionDuration)
        footerUpdate(graphContainer)

    }

    // code pour gérer les boucles d'animation :

    // 2/ avec setInterval :
    function launchAnimation() {
        dragBarOn()
        const i = setInterval(() => {
            year = (year < yearEnd) ? year + 1 : year
            launchTrace(year, animTransitionDuration)
            if (year >= yearEnd) { inMotion = stopAnimation(i) }
        }, loopDuration)
        return i
    }
    function stopAnimation(i) {
        lightBarOff()
        motionButtonUpdate(svgSlider, false)
        clearInterval(i)
        return null
    }
    /*
    // 1/ avec async et await :
    let waitAndTrace = (year, duration) => {
        return new Promise((resolve, reject) => {
            console.log("WaitAndTrace_1 : ", Date.now()-t0)
            setTimeout( () => {
                resolve( launchTrace(year, animTransitionDuration) )
            }, duration)
            console.log("WaitAndTrace_2 : ", Date.now()-t0)
        })
    }
    let endAnimation = false // passe à true dès qu'une animation se termine
    async function launchAnimation(localYear, yearEnd) {
        endAnimation = false
        while (inMotion) {
            console.group("year = ", localYear)
            console.log("launchAnimation : ", Date.now()-t0)
            year = localYear
            const trace = await waitAndTrace(localYear, loopDuration)

            trace.then(() => { 
                localYear++
                if (localYear > yearEnd) { 
                    inMotion = false
                    lightBarOff()
                }
            })
            console.groupEnd()
        }
        endAnimation = true
    }
    */

    /////////////////////////////////////////////////
    ///                                           ///
    ///  INITIALISATION DE LA STRUCTURE DU HTML   ///
    ///                                           ///
    /////////////////////////////////////////////////

    const {
        graphContainer,
        titleheader,
        svgSelection,
        bars,
        axis,
        labels,
        tooltips,
        carto,
        svgSlider,
        motionButton,
        slider,
        footer,
    } = htmlCreate(yearStart)

    /////////////////////////////////
    ///                           ///
    ///  GESTION DES EVENEMENTS   ///
    ///                           ///
    /////////////////////////////////

    // == Mode clair/obscur ==
    const darkmode = document.querySelector("#darkmode")
    darkmode.addEventListener("pointermove", () => {
        darkmode.style.opacity = 1
    })

    darkmode.addEventListener("pointerdown", () => {
        darkmode.style.opacity = 1
    })

    darkmode.addEventListener("pointerleave", () => {
        setTimeout(() => darkmode.style.opacity = 0.6, 500)
    })

    darkmode.addEventListener("click", () => {
        light = (light) ? 0 : 1
        darkOrLightMode()
    })

    // === Input top N (nombre de pays participant au palmares) ===
    const topselect = document.querySelector("#topselect")
    const input = topselect.querySelector("#topnumber")
    const incNumber = topselect.querySelector("#incarrow")
    const decNumber = topselect.querySelector("#decarrow")

    input.innerText = topN

    topselect.addEventListener("pointermove", () => {
        topselect.style.backgroundColor = "#fff"
    })

    topselect.addEventListener("pointerdown", () => {
        topselect.style.backgroundColor = "#fff"
    })


    topselect.addEventListener("pointerleave", () => {
        setTimeout(() => topselect.style.backgroundColor = "#ddd", 500)
    })

    topselect.querySelectorAll(".arrow").forEach(function (arrow) {
        arrow.addEventListener("pointermove", () => {
            arrow.style.borderTopColor = "#f00"
            arrow.style.borderBottomColor = "#f00"
        })
    })

    topselect.querySelectorAll(".arrow").forEach(function (arrow) {
        arrow.addEventListener("pointerdown", () => {
            arrow.style.borderTopColor = "#f00"
            arrow.style.borderBottomColor = "#f00"
        })
    })

    topselect.querySelectorAll(".arrow").forEach(function (arrow) {
        arrow.addEventListener("pointerleave", () => {
            setTimeout(() => {
                arrow.style.borderTopColor = "#000"
                arrow.style.borderBottomColor = "#000"
            }, 500)
        })
    })

    incNumber.addEventListener("click", () => {
        topN = (topN < N) ? topN + 1 : 1
        input.innerText = topN
        viewport()
        cartoUpdate(shiftTransitionDuration)
        if (!inMotion) {
            launchTrace(year, shiftTransitionDuration)
        }
    })
    decNumber.addEventListener("click", () => {
        topN = (topN > 1) ? topN - 1 : N
        input.innerText = topN
        viewport()
        cartoUpdate(shiftTransitionDuration)
        if (!inMotion) {
            launchTrace(year, shiftTransitionDuration)
        }
    })

    // == Choix langue anglais/français ==
    const langtoggle = document.querySelector("#langtoggle")
    langtoggle.addEventListener("pointermove", () => {
        langtoggle.style.opacity = 1
    })

    langtoggle.addEventListener("pointerdown", () => {
        langtoggle.style.opacity = 1
    })

    langtoggle.addEventListener("pointerleave", () => {
        setTimeout(() => langtoggle.style.opacity = 0.6, 500)
    })

    langtoggle.addEventListener("click", () => {
        lang = (lang === "fr") ? "en" : "fr"
        titleheaderUpdate(titleheader)
        labels.selectAll(".label").remove()
        launchTrace(year, 0)
    })

    // === Dropdown pour selection de feature = clé de l'object dataSet ===
    //          d'après le script : https://www.youtube.com/watch?v=hBbrGFCszU4 //
    const dropdown = document.querySelector("#titledropdown")

    const select = dropdown.querySelector(".select")
    const caret = dropdown.querySelector(".caret")
    const menu = dropdown.querySelector(".menu")
    const options = dropdown.querySelectorAll(".menu li")
    const selected = dropdown.querySelector(".selected")
    let menuUnfold = false
    function unFold() {
        menu.style.maxHeight = (menuUnfold) ? "0px" : "500px"
        menu.style.opacity = (menuUnfold) ? "0" : "0.95"
        menuUnfold = (menuUnfold) ? false : true
    }
    select.addEventListener("pointermove", () => {
        titleheader.selectAll(".select").style("background", () => {
            return (light) ? "rgb(100, 100, 100)" : "rgb(255, 255, 255)"
        })
        select.addEventListener("pointerleave", () => {
            titleheader.selectAll(".select").style("background", ctColor)
        })
    })
    select.addEventListener("click", () => {
        caret.classList.toggle("caret-rotate")
        unFold()

    })
    options.forEach(option => {
        option.addEventListener("click", () => {
            options.forEach(option => {
                option.classList.remove("active")
                option.style.background = ctColor
            })
            option.classList.toggle("active")
            option.style.background = (light) ? "rgb(100, 100, 100)" : "rgb(255, 255, 255)"
            selected.innerHTML = option.innerHTML
            caret.classList.remove("caret-rotate")
            unFold()
            // mise à jour des données data correspond à la nouvelle clé sélectionnée
            feature = option.getAttribute("id")
            data = dataSet[feature]
            initialColorMap(shiftTransitionDuration) // on remet les couleurs initiales de la carte
            viewport()
            cartoUpdate(shiftTransitionDuration)
            if (!inMotion) {
                launchTrace(year, shiftTransitionDuration)
            }
        })
    })

    // === Infobulle pour afficher le nom du pays à côté du drapeau au survol ===
    /*
    svgSelection.selectAll(".flagLabel").on("pointermove", () => {
        // pour éviter les fenêtres intempestives si on touche trop longtemps l'écran
        window.oncontextmenu = function(event) {
            event.preventDefault()
            event.stopPropagation()
            return false
        }
    })
    */

    function tooltipDisplay(e) {
        e.stopPropagation()
        e.preventDefault()
        //graphContainer.style("touch-action", "none")
        //graphContainer.selectAll("span").style("user-select", "none")
        //graphContainer.selectAll("text").style("user-select", "none")
        const countryCode = e.currentTarget.parentNode.id
        const country = countryId[countryCode].name[lang]
        const svg = document.querySelector(".svgSelection")
        const node = svgSelection.select("#labels").select(`#${countryCode}`).select(".flagLabel")
        //node.style("touch-action", "none")
        //node.style("user-select", "none")
        const pt = svg.createSVGPoint()
        pt.x = e.clientX
        pt.y = e.clientY
        const cursor = pt.matrixTransform(svg.getScreenCTM().inverse())

        // tracé du tooltip
        const hoverflag = svgSelection.select(".hoverflag").attr("id", countryCode)
        hoverflag.attr("transform", `translate(${Math.min(150, cursor.x + 40)}, ${cursor.y + 5})`)
            .style("opacity", 1)
        const padding = fontSize * 0.5
        hoverflag.select("text").text(country)
            .style("font-size", `${fontSize * 1.0}px`)
        const tooltipBox = hoverflag.select("text").node().getBBox()
        hoverflag.select("rect")
            .attr("width", tooltipBox.width + padding * 2)
            .attr("height", tooltipBox.height + padding * 2)
            .attr("x", -padding)
            .attr("y", -tooltipBox.height - padding * 0.7)
            .attr("rx", fontSize * 0.5)
    }
    function tooltipHide(countryCode) {
        // masque le tooltip du pays de code countryCode
        svgSelection.select(`#${countryCode}.hoverflag`)
            .attr("id", "empty")
            .style("opacity", 0)
    }


    // === Slider (échelle de temps) ===
    function dragBarOn() {
        // éclairage rouge du centre du runner (mouvement) 
        slider.select("#moveBar")
            .style("fill", panelColor.dragFill).style("opacity", 1.0)
        slider.select("#runner").select("#rim")
            .style("fill", panelColor.dragFill).style("opacity", 1.0)
    }

    function lightBarOn() {
        // éclairage du centre du runner (gris clair)
        slider.select("#runner").select("#rim")
            .style("fill", panelColor.hoverFill).style("opacity", 1.0)
    }

    function lightBarOff() {
        // extinction du centre du runner : gris foncé si repos, rouge si animation auto
        slider.select("#moveBar")
            .style("fill", panelColor.fill).style("opacity", 1.0)
        slider.select("#runner").select("#rim")
            .style("fill", panelColor.fill).style("opacity", 1.0)
    }

    function dragBarStop() {
        // mise en butée du runner
        slider.select("#runner").select("#rim")
            .style("fill", panelColor.dragStop).style("opacity", 1.0)
    }
    // renvoie l'année en fonction de l'event et du décalage initial runner/pointer
    function sliderXCoordinateToYear(e, shiftX) {
        let xm = e.clientX - (svgMargin.left + rRunner / 4) - shiftX
        if (xm <= 0) {
            xm = 0
            dragBarStop()
        }
        if (xm >= rangeYear) {
            xm = rangeYear
            dragBarStop()
        }
        return Math.min(yearEnd, Math.round(yearScale.invert(xm)))
    }
    // positionne le runner en fonction de l'année
    function setRunner(year, transitionDuration) {
        slider.select("#fixBar")
            .transition(currentTransition(transitionDuration))
            .attr("x", `${yearScale(year)}`) // track 
            .attr("width", `${yearScale(yearMax) - yearScale(year) + rRunner / 4}`) // track 
        slider.select("#moveBar")
            .transition(currentTransition(transitionDuration))
            .attr("width", `${yearScale(year) + rRunner / 4}`) // track 
        slider.select("#runner")
            .transition(currentTransition(transitionDuration))
            .attr("transform", `translate( ${yearScale(year)}, 0)`)
    }
    // affichage de l'année au dessus du runner, uniquement en dragage :
    function yearRunnerDisplay() {
        slider.select("#currentyear")
            .attr("x", 0)
            .attr("y", -rRunner * 0.8)
            .text(year)
            .style("fontSize", fontSize * 0.8)
            .style("opacity", 1)
    }

    // actions à lancer pour draguer le runner
    function dragRunner(e, shiftX) {
        e.preventDefault()
        //let delayToDrag = (restartMotion || inMotion) ? loopDuration: 0
        restartMotion = (restartMotion || inMotion)
        inMotion = stopAnimation(inMotion)
        dragBarOn()
        //setTimeout( () => {
        year = sliderXCoordinateToYear(e, shiftX)
        setRunner(year, slideTransitionDuration)
        yearRunnerDisplay()
        //}, delayToDrag)
    }
    // actions à lancer quand on arrête de draguer le runner
    function stopDragRunner() {
        graphContainer.on("pointermove", null, { once: true }) // pour pouvoir arrêter l'event "pointermove"
        slider.select("#currentyear").style("opacity", 0)
        // redémarrage après draguage :
        //initialColorMap(shiftTransitionDuration) // on remet les couleurs initiales de la carte
        if (!inMotion && restartMotion) {
            inMotion = launchAnimation()
            restartMotion = false
        } else if (!inMotion) {
            lightBarOff()
            launchTrace(year, shiftTransitionDuration)
        }
    }

    // permet de déplacer le runner d'un coup en cliquant sur le slider [mouse + touch]
    slider.select("#slideBar").on("pointerdown", e => {
        //eventCounter(e.type)
        dragRunner(e, 0)
        graphContainer.on("pointermove", e => {
            //eventCounter(e.type)
            dragRunner(e, 0)
        })
    })
    // éclairage du runner quand on survole le slider [mouse]
    slider.select("#slideBar").on("pointermove", e => {
        e.preventDefault()
        if (!inMotion && !restartMotion) { lightBarOn() }
    })
    // extinction du runner en quittant au survol [mouse]
    slider.select("#slideBar").on("pointerleave", e => {
        if (!inMotion && !restartMotion) { lightBarOff() }
    })

    // === Animation manuelle en déplaçant le slider : version fonctionnelle ====
    // permet de draguer le runner en cliquant sur le runner [mouse + touch]
    slider.select("#touchDisc").on("pointerdown", e => {
        //eventCounter(e.type)
        e.stopPropagation() // indispensable pour ne pas propager l'event au slider
        graphContainer.style("touch-action", "none") // pour annuler le scroll en touchscreen
        shiftX = e.clientX - (svgMargin.left + rRunner / 4) - yearScale(year)        // initialisation décalage runner / pointeur

        graphContainer.on("pointermove", e => {
            //eventCounter(e.type)
            dragRunner(e, shiftX)
        })
    })
    // sortie de l'élément en glissant [mouse] et perte de contact avec l'écran, en glissement ou perte "douce" [touch] 
    graphContainer.on("pointerleave", e => {                     // sortie systématique en touchscreen et quand on quitte par le bord en pc
        //eventCounter(e.type)
        //graphContainer.style("touch-action", "auto")           // !!! ne pas mettre cette ligne qui bloque le runner en touchscreen !!! et cela ne bloque pas le scroll
        stopDragRunner()
    })

    // sortie en relachant le clic [mouse] ou en levant rapidement le contact [touch]
    graphContainer.on("pointerup", e => {                      // sortie que en pc (déclic souris)
        //eventCounter(e.type)
        graphContainer.style("touch-action", "auto")           // incroyable ! pour rétablir le scroll en touchscreen --> sinon, scroll bloqué en touchscreen
        stopDragRunner()
    })




    // === Lancement du mode animation automatique ===
    const toggleMotion = () => {
        if (!inMotion && year < yearEnd) {
            t0 = Date.now()
            inMotion = launchAnimation()
        } else if (inMotion) {
            inMotion = stopAnimation(inMotion)
        }
    }

    // ...lancement en cliquant sur le graphique (svgSelection)
    svgSelection.on("click", toggleMotion)
    // ...lancement en cliquant sur le  bouton
    motionButton.select("circle").on("click", toggleMotion)


    // === Changement de la taille de la fenêtre ===
    window.onresize = (event) => {
        viewport()
        cartoUpdate(slideTransitionDuration)
        if (!inMotion) {
            launchTrace(year, slideTransitionDuration)
        }
    }

    // === Compteur d'évènements ===
    /*
    function eventCounter(eventType) {
        counter = document.querySelector("#eventindicators").querySelector(`#${eventType}`).querySelector(".ind")
        counter.innerHTML ++
        if (!["pointermove", "pointerdown", "pointerleave", "pointerup" ].includes(eventType)) {
            c = document.querySelector("#eventindicators").querySelector(`#pointerx`)
            c.querySelector(".desc").innerHTML = eventType
            c.querySelector(".ind").innerHTML ++
        }
    }
    */

    ///////////////////
    ///             ///
    ///  DEMARRAGE  ///
    ///             ///
    ///////////////////

    if (mode == "video") {
        graphContainer.select("#upperheader").style("display", "none")
        graphContainer.select(".footer").style("display", "none")
    }
    lightBarOff()
    darkOrLightMode(light)
    viewport()
    cartoUpdate(0)
    launchTrace(yearStart, slideTransitionDuration)
    if (autoLaunch) {
        inMotion = false
        setTimeout(() => {
            toggleMotion()
        }, animTimer)
    }


}


