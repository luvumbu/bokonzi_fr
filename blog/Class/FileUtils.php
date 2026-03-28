<?php
/**
 * FileUtils.php — Fonctions utilitaires de gestion de fichiers / File management utility functions
 * FR: Regroupe les fonctions de verification, creation de dossiers, extensions et la classe ImageResizer
 * EN: Consolidates file checking, directory creation, extensions and the ImageResizer class
 */

// ======================================================
// Verification d'existence de fichier
// ======================================================

function checkFileExists($filePath) {
    return file_exists($filePath);
}

// ======================================================
// Gestion de repertoires
// ======================================================

function EnsureDirectoryExists($path) {
    if (is_dir($path)) {
        return true;
    } else {
        return mkdir($path, 0777, true);
    }
}

// ======================================================
// Extensions et categories de fichiers
// ======================================================

function getFileExtension($filepath) {
    return strtolower(substr(strrchr($filepath, '.'), 1));
}

function detectFileCategory($input) {
    if (strpos($input, '.') !== false) {
        $ext = strtolower(substr(strrchr($input, '.'), 1));
    } else {
        $ext = strtolower($input);
    }

    switch ($ext) {
        case 'jpg': case 'jpeg': case 'png': case 'gif': case 'bmp':
        case 'webp': case 'tiff': case 'tif': case 'svg': case 'ico':
        case 'heic': case 'raw': case 'psd': case 'ai': case 'eps':
            return 'image';

        case 'mp4': case 'm4v': case 'mkv': case 'mov': case 'avi':
        case 'wmv': case 'flv': case 'f4v': case 'webm': case 'mpg':
        case 'mpeg': case '3gp': case '3g2': case 'ts': case 'vob':
        case 'ogv': case 'm2ts': case 'divx':
            return 'video';

        case 'mp3': case 'wav': case 'aac': case 'ogg': case 'oga':
        case 'flac': case 'wma': case 'm4a': case 'aiff': case 'aif':
        case 'opus': case 'alac': case 'mid': case 'midi':
            return 'musique';

        default:
            return 'inconnu';
    }
}

// ======================================================
// Listage de fichiers d'un repertoire
// ======================================================

function getFilesFromDir($dir, $excludeFile = null) {
    $result = [];

    if (is_dir($dir)) {
        $files = scandir($dir);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') continue;
            if ($excludeFile !== null && $file === $excludeFile) continue;
            $result[] = $file;
        }
    }

    return $result;
}

// ======================================================
// Rendu adaptatif de fichier (image, video, audio, autre)
// ======================================================

function renderFileMedia($src, $id = '', $class = '') {
    $category = detectFileCategory($src);
    $idAttr = $id ? " id=\"{$id}\"" : '';
    $classAttr = $class ? " class=\"{$class}\"" : '';

    $ext = strtolower(pathinfo($src, PATHINFO_EXTENSION));
    $mimeVideo = ['mp4'=>'video/mp4','webm'=>'video/webm','ogg'=>'video/ogg','ogv'=>'video/ogg','mov'=>'video/quicktime','m4v'=>'video/x-m4v','mkv'=>'video/x-matroska','avi'=>'video/x-msvideo','wmv'=>'video/x-ms-wmv'];
    $mimeAudio = ['mp3'=>'audio/mpeg','wav'=>'audio/wav','aac'=>'audio/aac','ogg'=>'audio/ogg','oga'=>'audio/ogg','flac'=>'audio/flac','wma'=>'audio/x-ms-wma','m4a'=>'audio/mp4','aiff'=>'audio/aiff','aif'=>'audio/aiff','opus'=>'audio/opus'];

    switch ($category) {
        case 'image':
            return "<img{$idAttr}{$classAttr} src=\"{$src}\" alt=\"\">";
        case 'video':
            $type = $mimeVideo[$ext] ?? 'video/' . $ext;
            return "<video{$idAttr}{$classAttr} controls><source src=\"{$src}\" type=\"{$type}\"></video>";
        case 'musique':
            $type = $mimeAudio[$ext] ?? 'audio/' . $ext;
            return "<audio{$idAttr}{$classAttr} controls><source src=\"{$src}\" type=\"{$type}\"></audio>";
        default:
            $name = basename($src);
            return "<a{$idAttr}{$classAttr} href=\"{$src}\" download>{$name}</a>";
    }
}

// ======================================================
// Classe ImageResizer
// ======================================================

class ImageResizer
{
    private $image;
    private $width;
    private $height;
    private $imageType;

    public function __construct($filename)
    {
        $this->load($filename);
    }

    private function load($filename)
    {
        $imageInfo = getimagesize($filename);
        $this->width = $imageInfo[0];
        $this->height = $imageInfo[1];
        $this->imageType = $imageInfo[2];

        switch ($this->imageType) {
            case IMAGETYPE_JPEG:
                $this->image = imagecreatefromjpeg($filename);
                break;
            case IMAGETYPE_GIF:
                $this->image = imagecreatefromgif($filename);
                break;
            case IMAGETYPE_PNG:
                $this->image = imagecreatefrompng($filename);
                break;
            default:
                throw new Exception("Unsupported image type");
        }
    }

    public function resize($maxWidth, $maxHeight)
    {
        $aspectRatio = $this->width / $this->height;

        if ($maxWidth / $maxHeight > $aspectRatio) {
            $newWidth = $maxHeight * $aspectRatio;
            $newHeight = $maxHeight;
        } else {
            $newWidth = $maxWidth;
            $newHeight = $maxWidth / $aspectRatio;
        }

        $newImage = imagecreatetruecolor($newWidth, $newHeight);

        if ($this->imageType == IMAGETYPE_PNG) {
            imagealphablending($newImage, false);
            imagesavealpha($newImage, true);
            $transparent = imagecolorallocatealpha($newImage, 255, 255, 255, 127);
            imagefill($newImage, 0, 0, $transparent);
        } elseif ($this->imageType == IMAGETYPE_GIF) {
            $transparentIndex = imagecolortransparent($this->image);
            if ($transparentIndex >= 0) {
                $transparentColor = imagecolorsforindex($this->image, $transparentIndex);
                $newTransparentIndex = imagecolorallocate($newImage, $transparentColor['red'], $transparentColor['green'], $transparentColor['blue']);
                imagecolortransparent($newImage, $newTransparentIndex);
            }
        }

        imagecopyresampled($newImage, $this->image, 0, 0, 0, 0, $newWidth, $newHeight, $this->width, $this->height);
        $this->image = $newImage;
        $this->width = $newWidth;
        $this->height = $newHeight;
    }

    public function save($filename, $imageType = IMAGETYPE_JPEG, $compression = 75, $permissions = null)
    {
        switch ($imageType) {
            case IMAGETYPE_JPEG:
                imagejpeg($this->image, $filename, $compression);
                break;
            case IMAGETYPE_GIF:
                imagegif($this->image, $filename);
                break;
            case IMAGETYPE_PNG:
                imagepng($this->image, $filename);
                break;
            default:
                throw new Exception("Unsupported image type");
        }

        if ($permissions !== null) {
            chmod($filename, $permissions);
        }
    }

    public function output($imageType = IMAGETYPE_JPEG)
    {
        switch ($imageType) {
            case IMAGETYPE_JPEG:
                header('Content-Type: image/jpeg');
                imagejpeg($this->image);
                break;
            case IMAGETYPE_GIF:
                header('Content-Type: image/gif');
                imagegif($this->image);
                break;
            case IMAGETYPE_PNG:
                header('Content-Type: image/png');
                imagepng($this->image);
                break;
            default:
                throw new Exception("Unsupported image type");
        }
    }

    public function __destruct()
    {
        if ($this->image) {
            imagedestroy($this->image);
        }
    }
}

?>
