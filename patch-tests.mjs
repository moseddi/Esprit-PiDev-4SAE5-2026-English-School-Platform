import fs from 'fs';
import path from 'path';

function findTestFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const stat = fs.statSync(path.join(dir, file));
        if (stat.isDirectory()) {
            findTestFiles(path.join(dir, file), fileList);
        } else if (file.endsWith('.spec.ts')) {
            fileList.push(path.join(dir, file));
        }
    }
    return fileList;
}

const baseDir = path.join(process.cwd(), 'src', 'app');
const testFiles = findTestFiles(baseDir);

function patchFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    if (!content.includes('HttpClientTestingModule')) {
        content = "import { HttpClientTestingModule } from '@angular/common/http/testing';\n" + content;
        changed = true;
    }
    if (!content.includes('RouterTestingModule')) {
        content = "import { RouterTestingModule } from '@angular/router/testing';\n" + content;
        changed = true;
    }
    
    // Some components fail with "reading root" from RouterLink because ActivatedRoute snapshot is empty.
    // Instead of messing with providers, usually RouterTestingModule.withRoutes([]) helps.
    
    // Add to imports array
    content = content.replace(/imports:\s*\[([^\]]+)\]/g, (match, p1) => {
        let newImports = p1;
        if (!p1.includes('HttpClientTestingModule')) {
            newImports += ', HttpClientTestingModule';
        }
        if (!p1.includes('RouterTestingModule')) {
            newImports += ', RouterTestingModule.withRoutes([])';
        }
        return `imports: [${newImports}]`;
    });

    if (changed || content.includes('RouterTestingModule')) {
        fs.writeFileSync(file, content);
        console.log('Patched ' + file);
    }
}

testFiles.forEach(patchFile);
