#!/usr/bin/env node

module.exports = function(context) {
    const fs = require('fs');
    const path = require('path');
    const xml2js = require('xml2js');

    const manifestPath = path.join(context.opts.projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

    if (!fs.existsSync(manifestPath)) {
        console.error('AndroidManifest.xml nie został znaleziony pod ścieżką: ' + manifestPath);
        return;
    }

    const parser = new xml2js.Parser();
    const builder = new xml2js.Builder();

    fs.readFile(manifestPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Błąd podczas czytania AndroidManifest.xml:', err);
            return;
        }

        parser.parseString(data, (err, result) => {
            if (err) {
                console.error('Błąd podczas parsowania AndroidManifest.xml:', err);
                return;
            }

            // Dodanie przestrzeni nazw tools, jeśli nie istnieje
            if (!result.manifest.$ || !result.manifest.$.xmlns$tools) {
                result.manifest.$ = result.manifest.$ || {};
                result.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
            }

            // Usunięcie wszystkich wystąpień WRITE_EXTERNAL_STORAGE
            if (result.manifest['uses-permission']) {
                result.manifest['uses-permission'] = result.manifest['uses-permission'].filter(permission => {
                    return permission.$['android:name'] !== 'android.permission.WRITE_EXTERNAL_STORAGE';
                });
            }

            // Opcjonalnie: Dodanie uprawnienia z maxSdkVersion, jeśli potrzebne
            result.manifest['uses-permission'] = result.manifest['uses-permission'] || [];
            result.manifest['uses-permission'].push({
                '$': {
                    'android:name': 'android.permission.WRITE_EXTERNAL_STORAGE',
                    'android:maxSdkVersion': '29',
                    'tools:node': 'replace'
                }
            });

            const updatedXml = builder.buildObject(result);

            fs.writeFile(manifestPath, updatedXml, 'utf8', (err) => {
                if (err) {
                    console.error('Błąd podczas zapisywania zmodyfikowanego AndroidManifest.xml:', err);
                } else {
                    console.log('AndroidManifest.xml został pomyślnie zmodyfikowany.');
                }
            });
        });
    });
};
