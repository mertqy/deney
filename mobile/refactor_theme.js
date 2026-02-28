const fs = require('fs');
const path = require('path');
const d = 'c:/Users/Mert/Desktop/deney/mobile/src';

const walkSync = function (dir, filelist) {
    const files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function (file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = walkSync(path.join(dir, file), filelist);
        }
        else {
            filelist.push(path.join(dir, file));
        }
    });
    return filelist;
};

const files = walkSync(d).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

files.forEach(p => {
    let c = fs.readFileSync(p, 'utf8');
    let modified = false;

    if (c.includes('Junto')) {
        c = c.replace(/Junto/g, 'Meetiva');
        modified = true;
    }

    if (c.includes('import { Colors }') || c.includes('import {Colors}')) {
        c = c.replace(/import\s+\{\s*Colors\s*\}\s+from\s+['"](.*)\/colors['"];/, "import { useThemeColor } from '$1/colors';");
        c = c.replace(/const styles = StyleSheet\.create\(\{/, "const getStyles = (Colors: any) => StyleSheet.create({");

        const componentRegex = /(export const [A-Za-z0-9_]+ = \(.*?\) => \{\r?\n)/;
        if (componentRegex.test(c)) {
            c = c.replace(componentRegex, "$1    const Colors = useThemeColor();\n    const styles = getStyles(Colors);\n");
        }
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(p, c);
        console.log('Updated ' + p);
    }
});
console.log("Done");
