<?php
/**
 * DateUtils.php — Fonctions utilitaires de date/heure / Date/time utility functions
 * FR: Regroupe formatDateFr et la classe FrenchClock
 * EN: Consolidates formatDateFr and the FrenchClock class
 */

// ======================================================
// Formatage de date en francais
// ======================================================

/**
 * Convertit une date ISO en format francais lisible.
 * Ex: "2025-05-25 23:38:03" → "25 mai 2025 a 23h38"
 */
function formatDateFr($dateStr, $withTime = true) {
    if (!$dateStr || !strtotime($dateStr)) {
        return 'Date invalide';
    }

    $mois = array(
        '01' => 'janvier', '02' => 'février', '03' => 'mars',
        '04' => 'avril', '05' => 'mai', '06' => 'juin',
        '07' => 'juillet', '08' => 'août', '09' => 'septembre',
        '10' => 'octobre', '11' => 'novembre', '12' => 'décembre'
    );

    $dateParts = explode(' ', $dateStr);
    $date = explode('-', $dateParts[0]);

    $jour = isset($date[2]) ? $date[2] : '??';
    $moisTexte = isset($mois[$date[1]]) ? $mois[$date[1]] : '??';
    $annee = isset($date[0]) ? $date[0] : '????';

    $result = $jour . ' ' . $moisTexte . ' ' . $annee;

    if ($withTime && isset($dateParts[1])) {
        $heureMinute = substr($dateParts[1], 0, 5);
        $result .= ' à ' . str_replace(':', 'h', $heureMinute);
    }

    return $result;
}

// ======================================================
// Classe FrenchClock — Horloge francaise avancee
// ======================================================

class FrenchClock
{
    private $tz;
    private $base;

    public function __construct($baseDateTime, $timezone = 'Europe/Paris')
    {
        $this->tz   = new DateTimeZone($timezone);
        $this->base = new DateTime($baseDateTime, $this->tz);
    }

    public function now() { return new DateTime('now', $this->tz); }
    public function base() { return clone $this->base; }

    public function formatNow($pattern='Y-m-d H:i:s') { return $this->now()->format($pattern); }
    public function formatBase($pattern='Y-m-d H:i:s') { return $this->base->format($pattern); }

    public function formatNowFrench()
    {
        $jours = array("dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi");
        $mois  = array("","janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre");

        $dt = $this->now();
        $jourSemaine = $jours[(int)$dt->format("w")];
        $jour = $dt->format("d");
        $moisTxt = $mois[(int)$dt->format("n")];
        $annee = $dt->format("Y");
        $heure = $dt->format("H:i:s");

        return "$jourSemaine $jour $moisTxt $annee à $heure";
    }

    public function diffFromBase() { return $this->base->diff($this->now()); }

    public function diffFromBaseHuman()
    {
        $d = $this->diffFromBase();
        $parts = array();
        if ($d->y) $parts[] = $d->y.' an'.($d->y>1?'s':'');
        if ($d->m) $parts[] = $d->m.' mois';
        if ($d->d) $parts[] = $d->d.' jour'.($d->d>1?'s':'');
        if ($d->h) $parts[] = $d->h.' h';
        if ($d->i) $parts[] = $d->i.' min';
        if ($d->s && !$d->h && !$d->i) $parts[] = $d->s.' s';
        return $parts ? implode(' ', $parts) : '0 s';
    }

    public function totalDaysSinceBase() { return (int)$this->diffFromBase()->days; }
    public function totalWeeksSinceBase() { return floor($this->totalDaysSinceBase()/7); }
    public function totalMonthsSinceBase() { $diff=$this->diffFromBase(); return $diff->y*12 + $diff->m; }
    public function yearsSinceBase() { return $this->diffFromBase()->y; }

    public function getNextAnniversaryDate()
    {
        $now = $this->now();
        $jour = $this->base->format("d");
        $mois = $this->base->format("m");
        $year = $now->format("Y");
        $anniv = new DateTime("$year-$mois-$jour 00:00:00", $this->tz);
        if ($anniv < $now) $anniv->modify("+1 year");
        return $anniv;
    }

    public function daysToNextAnniversary()
    {
        $diff = $this->now()->diff($this->getNextAnniversaryDate());
        return (int)$diff->days;
    }

    public function weeksToNextAnniversary()
    {
        return floor($this->daysToNextAnniversary()/7);
    }

    public function monthsToNextAnniversary()
    {
        $diff = $this->now()->diff($this->getNextAnniversaryDate());
        return (int)$diff->m;
    }

    public function timeToAnniversary()
    {
        $diff = $this->now()->diff($this->getNextAnniversaryDate());
        return array(
            'mois'=>$diff->m,
            'jours'=>$diff->d,
            'heures'=>$diff->h,
            'minutes'=>$diff->i,
            'secondes'=>$diff->s
        );
    }

    public function nextAnniversary()
    {
        $anniv = $this->getNextAnniversaryDate();
        if ($anniv->format("Y-m-d") == $this->now()->format("Y-m-d")) return "Aujourd'hui c'est l'anniversaire !";
        $info = $this->timeToAnniversary();
        $parts=array();
        if($info['mois']) $parts[]=$info['mois'].' mois';
        if($info['jours']) $parts[]=$info['jours'].' jour'.($info['jours']>1?'s':'');
        if($info['heures']) $parts[]=$info['heures'].' h';
        if($info['minutes']) $parts[]=$info['minutes'].' min';
        return "Prochain anniversaire dans ".implode(" ",$parts);
    }
}

?>
