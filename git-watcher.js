const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const debounceTime = 8000; // 8 seconds of silence before commit/push
let timeoutId = null;

console.log("==================================================");
console.log("🚀 AP School ERP Git Autocommit Watcher Started");
console.log("==================================================");

function runCmd(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve(stdout.trim());
    });
  });
}

async function syncGit() {
  try {
    // Stage all changes (respects .gitignore)
    await runCmd("git add .");
    
    // Check if there are changes to commit
    const status = await runCmd("git status --porcelain");
    if (!status) {
      return;
    }

    const lines = status.split("\n").map(l => l.trim()).filter(Boolean);
    const filesChanged = lines.length;

    // Generate meaningful commit message based on modified files
    let commitMsg = "refactor: sync local changes";
    if (lines.some(l => l.includes("LogoutConfirmModal"))) {
      commitMsg = "fix: resolve logout confirmation dialog button visibility";
    } else if (lines.some(l => l.includes("LoadingScreen"))) {
      commitMsg = "feat: implement student and teacher portal loading screens";
    } else if (lines.some(l => l.includes("LoginPortal"))) {
      commitMsg = "style: refine homepage announcement section";
    } else if (lines.some(l => l.includes("TeacherPortal"))) {
      commitMsg = "refactor: improve attendance register UI";
    } else if (lines.some(l => l.includes("StudentPortal"))) {
      commitMsg = "fix: update student dashboard layout";
    } else if (lines.some(l => l.includes("seed.js"))) {
      commitMsg = "feat: update database seed notices";
    } else if (lines.some(l => l.includes("walkthrough.md") || l.includes("task.md"))) {
      commitMsg = "docs: update project documentation";
    }

    console.log(`Staged changes. Committing ${filesChanged} file(s)...`);
    const commitResult = await runCmd(`git commit -m "${commitMsg}"`);
    console.log(`Commit result: ${commitResult.split('\n')[0]}`);

    const branch = await runCmd("git branch --show-current");
    console.log(`Pushing changes to remote origin/${branch}...`);
    
    // Push and setup tracking upstream if it does not exist
    await runCmd(`git push -u origin ${branch}`);

    console.log(`
✅ Files Changed: ${filesChanged}
✅ Commit: ${commitMsg}
✅ Branch: ${branch}
✅ Push Status: Successful
`);
  } catch (err) {
    if (err.message.includes("CONFLICT")) {
      console.error("\n⚠️ Git Watcher detected a MERGE CONFLICT. Autopush suspended.");
      console.error("Please resolve conflicts manually before restarting the watcher.");
    } else {
      console.error("\n❌ Git Watcher Error:", err.message);
    }
  }
}

// Recursively watches files ignoring node_modules, .git, etc.
fs.watch(path.join(__dirname), { recursive: true }, (eventType, filename) => {
  if (!filename) return;

  // Ignore build/cache/git directories and ignored files
  if (
    filename.includes("node_modules") ||
    filename.includes(".git") ||
    filename.includes("dist") ||
    filename.includes("build") ||
    filename.includes(".env") ||
    filename.includes(".log") ||
    filename.includes("student_diff.txt") ||
    filename.includes("scratch")
  ) {
    return;
  }

  console.log(`[Watcher] Change detected: ${filename}`);

  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  timeoutId = setTimeout(() => {
    syncGit();
  }, debounceTime);
});
