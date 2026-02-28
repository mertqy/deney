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

const files = walkSync(d).filter(f => f.endsWith('.tsx'));

files.forEach(p => {
    let original = fs.readFileSync(p, 'utf8');
    let c = original;

    // Replace backgroundColor inside StyleSheet blocks
    if (c.includes('StyleSheet.create')) {
        // Find inputs and ensure they have color: Colors.textPrimary
        const inputRegex = /(input:\s*\{[^}]*)(\})/g;
        c = c.replace(inputRegex, (match, p1, p2) => {
            if (!p1.includes('color:')) {
                return p1 + 'color: Colors.textPrimary,\n' + p2;
            }
            return match;
        });

        const textAreaRegex = /(textArea:\s*\{[^}]*)(\})/g;
        c = c.replace(textAreaRegex, (match, p1, p2) => {
            if (!p1.includes('color:')) {
                return p1 + 'color: Colors.textPrimary,\n' + p2;
            }
            return match;
        });

        // specific replacements for styles 
        c = c.replace(/backgroundColor:\s*['"]#(FFF|fff|FFFFFF|ffffff)['"]/g, 'backgroundColor: Colors.bgCard');
        c = c.replace(/borderColor:\s*['"]#(FFF|fff|FFFFFF|ffffff)['"]/g, 'borderColor: Colors.bgCard');
    }

    // Add placeholderTextColor to TextInputs
    c = c.replace(/<TextInput\s/g, '<TextInput placeholderTextColor={Colors.textSecondary} ');

    if (c !== original) {
        fs.writeFileSync(p, c);
        console.log('Updated ' + p);
    }
});
console.log("Done");
