//
//  Code permettant d'initialiser les paramètres de démarrage du graphique interactif
//

//////////////////////////////////////////////////
///                                            ///
///  PARAMETRES D'INITIALISATION DU GRAPHIQUE  ///
///                                            ///
//////////////////////////////////////////////////

    // PARAMETRES INITIAUX POUR LE PREMIER AFFICHAGE
        // langue : en / fr
        let lang = "fr"
        // nombre de pays du palmares :
        let topN = Math.min(N, 20)
        // mode clair/obscur : 1/0
        let light = 1
        // titre (sélection du dropdown)
        let feature = "co2"
        
        // année de démarrage de l'animation
        const yearStart = 1900

    // PARAMETRES TEMPORELS POUR LES ANIMATIONS (en ms)
        const animTransitionDuration =500  //durée de la transition pour aller de l'affichage year à l'affichage year+1, pour l'animation
        const loopDuration = 500            // durée pour la fonction async = durée de pause de l'image à year, pour l'animation
        const slideTransitionDuration = 100 //durée de la transition pour aller de l'affichage year à l'affichage year+1, pour le déplacement manuel slider
        const shiftTransitionDuration = 500 //durée de la transition quand on change de feature (avec le dropdown) ou de topN (avec l'input number)

    // PARAMETRES DE LANCEMENT AUTO AU DEMARRAGE
        const animTimer = 3000
        const mode = 'graph'
        const autoLaunch = true 
        
///////////////////////////////////////////
///                                     ///
///  AFFICHAGE DU GRAPHIQUE INTERACTIF  ///
///                                     ///
///////////////////////////////////////////

displayGraph(
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
) 
