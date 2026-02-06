class GitVisualizer {
    constructor() {
        // --- DOM Elements ---
        this.zones = {
            working: document.getElementById('files-working'),
            staging: document.getElementById('files-staging'),
            local: document.getElementById('files-local'),
            remote: document.getElementById('files-remote')
        };

        this.branchViz = document.getElementById('branchViz');

        this.infoBox = {
            el: document.getElementById('infoBox'),
            title: document.getElementById('infoTitle'),
            text: document.getElementById('infoText'),
            closeBtn: document.getElementById('closeInfoBtn')
        };

        this.resetBtn = document.getElementById('resetBtn');

        // --- State ---
        this.state = {
            initialized: false,
            files: {
                working: [],
                staging: [],
                local: [], // Commits
                remote: [] // Active Remote Commits (visual sync)
            },
            remotes: {
                origin: [],   // Fork
                upstream: []  // Main Repo
            },
            activeRemote: 'upstream', // 'upstream' or 'origin'
            branch: 'main',
            branches: ['main'], // Track available branches
            commitCount: 0,
            user: { name: 'User', email: 'user@example.com' },
            stash: []
        };

        // --- Event Listeners ---
        this.initEventListeners();

        // --- Scenarios ---
        this.initScenarios();

        // --- Initial Render ---
        this.renderAll();
    }


    initEventListeners() {
        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                this.showCommandPalette();
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'B') {
                e.preventDefault();
                this.cmdBranch('branch-list'); // Or dashboard
            }
        });

        // Command Buttons
        document.querySelectorAll('.cmd-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cmd = btn.dataset.cmd;
                this.executeCommand(cmd, btn);
            });

            // Tooltip on hover
            btn.addEventListener('mouseenter', (e) => {
                if (btn.classList.contains('error')) return; // No tooltip for error state

                const descEl = btn.querySelector('.cmd-desc');
                if (!descEl) return;

                // Create floating tooltip
                const tooltip = document.createElement('div');
                tooltip.id = 'floating-tooltip';
                tooltip.innerHTML = `<div class="tooltip-header">>> INFO_</div>${descEl.textContent}`;
                const terminalPanel = document.querySelector('.terminal-panel');
                const panelRight = terminalPanel ? terminalPanel.getBoundingClientRect().right + 10 : 400;
                tooltip.style.cssText = `
                    position: fixed;
                    left: ${panelRight}px;
                    top: ${e.clientY - 20}px;
                    width: 320px;
                    max-height: 220px;
                    overflow-y: auto;
                    background: #000;
                    border: 2px solid #00ff41;
                    padding: 12px;
                    z-index: 999999;
                    box-shadow: 0 0 25px rgba(0, 255, 65, 0.6);
                    color: #00ff41;
                    font-size: 13px;
                    font-family: 'JetBrains Mono', monospace;
                    line-height: 1.6;
                    pointer-events: none;
                `;
                document.body.appendChild(tooltip);
            });

            btn.addEventListener('mouseleave', () => {
                const tooltip = document.getElementById('floating-tooltip');
                if (tooltip) tooltip.remove();
            });
        });

        // Close Info Box
        this.infoBox.closeBtn.addEventListener('click', () => {
            this.hideInfo();
        });

        // Reset
        this.resetBtn.addEventListener('click', () => {
            this.reset();
        });
    }

    reset() {
        this.state = {
            initialized: false,
            files: {
                working: [],
                staging: [],
                local: [],
                remote: []
            },
            remotes: {
                origin: [],
                upstream: []
            },
            activeRemote: 'upstream',
            branch: 'main',
            branches: ['main'],
            commitCount: 0,
            user: { name: 'User', email: 'user@example.com' },
            stash: [],
            tags: []
        };
        this.renderAll();
        this.showInfo('Reset', 'Application state has been reset.');
    }

    // --- Core Logic ---

    async executeCommand(cmd, btnElement) {
        // Visual feedback for button click
        // Animation logic here handles the specific command flow
        console.log(`Executing: ${cmd}`);

        // Basic Guard: git init
        if (cmd !== 'init' && !this.state.initialized && !cmd.startsWith('config')) {
            this.showInfo('Error', 'Please run "git init" first to start a repository.');
            return;
        }

        switch (cmd) {
            case 'init':
                await this.cmdInit();
                break;
            case 'add-all':
            case 'add-file':
                await this.cmdAdd();
                break;
            case 'status':
                this.cmdStatus();
                break;
            case 'commit':
            case 'commit-am':
                await this.cmdCommit();
                break;
            case 'push':
                await this.cmdPush();
                break;
            case 'pull':
                await this.cmdPull();
                break;
            case 'fetch':
                await this.cmdFetch();
                break;
            case 'checkout':
            case 'checkout-b':
            case 'switch':
                await this.cmdCheckout(cmd);
                break;
            case 'diff':
            case 'diff-staged':
                this.cmdDiff(cmd);
                break;
            case 'branch':
            case 'branch-list':
            case 'branch-create':
            case 'branch-delete':
                await this.cmdBranch(cmd);
                break;
            case 'merge':
            case 'merge-no-ff':
                await this.cmdMerge(cmd);
                break;
            case 'config-user':
            case 'config-list':
            case 'alias':
                this.cmdConfig(cmd);
                break;
            case 'remote-add':
                this.cmdRemote(cmd);
                break;
            case 'clean':
                await this.cmdClean();
                break;
            case 'restore':
            case 'restore-staged':
                await this.cmdRestore(cmd);
                break;
            case 'reset':
            case 'reset-soft':
            case 'reset-hard':
                await this.cmdReset(cmd);
                break;
            case 'revert':
                await this.cmdRevert();
                break;
            case 'stash':
            case 'stash-pop':
            case 'stash-list':
            case 'stash-clear':
                await this.cmdStash(cmd);
                break;
            case 'log':
            case 'log-oneline':
            case 'log-graph':
            case 'show':
            case 'log-n':
            case 'log-author':
            case 'log-since':
            case 'log-grep':
            case 'log-stat':
            case 'shortstat':
            case 'describe':
                this.cmdLog(cmd);
                break;
            case 'mv':
            case 'rm':
            case 'ls-files':
                this.cmdFileOps(cmd);
                break;
            case 'blame':
                this.cmdBlame();
                break;
            case 'apply':
            case 'format-patch':
            case 'rebase-continue':
            case 'rebase-abort':
                this.cmdPatch(cmd);
                break;
            case 'reflog':
                this.cmdReflog();
                break;
            case 'bisect':
                this.cmdBisect();
                break;
            case 'shortlog':
                this.cmdShortlog();
                break;
            case 'grep':
                this.cmdGrep();
                break;
            case 'rebase':
            case 'rebase-i':
            case 'cherry-pick':
            case 'fork':
            case 'pr':
            case 'submodule':
            case 'worktree':
            case 'archive':
            case 'gc':
                this.cmdAdvancedOps(cmd); // Unified advanced ops handler
                break;
            case 'tag-list':
            case 'tag-create':
            case 'push-tags':
                this.cmdTag(cmd);
                break;
            case 'clone':
                this.showInfo('Clone', '📂 Repository cloned from remote URL. (Simulation)');
                break;
            case 'fetch-all':
                await this.animatePackage('zone-remote', 'zone-local', '☁️');
                this.showInfo('Fetch All', '📥 Fetched from all remotes.');
                break;
            case 'push-u':
                if (this.state.files.local.length === 0) {
                    this.showInfo('Error', 'No commits to push.');
                    return;
                }
                await this.animatePackage('zone-local', 'zone-remote', '🚀');
                this.state.files.remote = [...this.state.files.local];
                this.renderAll();
                this.showInfo('Push', '🚀 Pushed and set upstream tracking.');
                break;
            default:
                // All commands should be handled above
                this.showInfo('Info', `Command "${cmd}" executed.`);
        }

        // Advance scenario if active
        this.advanceScenario(cmd);
    }

    // --- Command Implementations ---

    async cmdInit() {
        if (this.state.initialized) {
            this.showInfo('Already Initialized', 'Git repository is already initialized.');
            return;
        }

        const anim = window.animEngine;
        const workingZone = document.getElementById('zone-working');
        const workingContainer = this.zones.working;

        // Step 0: Show "Initializing..." message
        this.showInfo('Initializing...', '⏳ Creating Git repository...');

        // Step 1: Activate Working Directory (0.2s - 0.4s)
        await anim.delay(200);
        anim.activateZone('zone-working', '#FFD700'); // Altın sarısı
        anim.glowPulse(workingZone, '#00ff41', 2);

        // Step 2: Show Git logo animation (0.4s - 0.8s)
        await anim.delay(200);
        const gitLogo = document.createElement('div');
        gitLogo.innerHTML = '<i class="ph ph-git-branch" style="font-size: 64px; color: #00ff41;"></i>';
        gitLogo.style.cssText = `
            position: fixed;
            top: 50%;
            left: 60%;
            transform: translate(-50%, -50%) scale(0);
            z-index: 99999;
            filter: drop-shadow(0 0 20px #00ff41);
        `;
        document.body.appendChild(gitLogo);

        gitLogo.animate([
            { transform: 'translate(-50%, -50%) scale(0) rotate(0deg)', opacity: 0 },
            { transform: 'translate(-50%, -50%) scale(1.5) rotate(360deg)', opacity: 1 },
            { transform: 'translate(-50%, -50%) scale(1) rotate(720deg)', opacity: 1 }
        ], { duration: 600, easing: 'ease-out', fill: 'forwards' });

        await anim.delay(800);
        gitLogo.animate([
            { opacity: 1 },
            { opacity: 0 }
        ], { duration: 300, easing: 'ease-in' }).onfinish = () => gitLogo.remove();

        // Step 3: Spawn sample files with stagger (0.8s - 1.4s)
        this.state.initialized = true;
        this.state.files.working = [
            { name: 'index.html', status: 'untracked', icon: 'ph-file-code' },
            { name: 'style.css', status: 'untracked', icon: 'ph-file-css' },
            { name: 'app.js', status: 'untracked', icon: 'ph-file-js' }
        ];

        // Clear and spawn with animation
        workingContainer.innerHTML = '';
        await anim.spawnFiles(workingContainer, this.state.files.working, 200);

        // Step 4: Celebration effect
        await anim.delay(200);
        const rect = workingZone.getBoundingClientRect();
        anim.confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 20);
        anim.sparkle(workingZone, 1000);

        // Step 5: Activate other zones (pasif)
        ['zone-staging', 'zone-local', 'zone-remote'].forEach(id => {
            const zone = document.getElementById(id);
            if (zone) {
                zone.style.opacity = '0.6';
                zone.style.borderColor = '#333';
            }
        });

        // Final message
        this.hideInfo();
        await anim.delay(100);
        this.showInfo('Repository Initialized', '✅ Git repository initialized!\n\n📁 3 files created in Working Directory\n🌿 Branch: main (0 commits)');

        this.renderBranches();
        this.updateCommandStates();
    }



    async cmdAdd() {
        if (this.state.files.working.length === 0) {
            this.showInfo('Nothing to Add', 'Working directory is clean.');
            return;
        }

        const anim = window.animEngine;
        const workingZone = document.getElementById('zone-working');
        const stagingZone = document.getElementById('zone-staging');
        const files = workingZone.querySelectorAll('.file-item');

        // Step 1: Select files (Highlights & Checkmarks)
        this.showInfo('Staging Checks', '📝 Selecting files for staging...');
        files.forEach(file => {
            file.style.transition = 'all 0.2s ease';
            file.style.borderColor = '#00ff41';
            file.style.boxShadow = '0 0 10px #00ff41';
            // Add checkmark
            const check = document.createElement('span');
            check.innerHTML = '✓';
            check.style.cssText = 'position: absolute; right: 5px; top: 5px; color: #00ff41; font-weight: bold;';
            file.appendChild(check);
        });
        await anim.delay(400);

        // Step 2: Packaging (Shrink files to center)
        this.showInfo('Packaging', '📦 Packaging changes...');
        const workingRect = workingZone.getBoundingClientRect();

        files.forEach(file => {
            file.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'; // Back easing
            file.style.transform = 'scale(0) translate(0, 0)';
            file.style.opacity = '0';
        });
        await anim.delay(400);

        // Step 3: Package Transfer
        const stagingRect = stagingZone.getBoundingClientRect();

        // Step 4: Transfer Animation (Motion Path)
        await anim.motionPath(null, workingRect, stagingRect, {
            duration: 800,
            icon: '📦',
            trail: true,
            rotation: 360,
            scale: [0, 1.5, 1]
        });

        // Step 5: Unbox in Staging
        stagingZone.style.borderColor = '#00ff41';
        anim.glowPulse(stagingZone, '#00ff41');

        // Data Update
        this.state.files.staging = [...this.state.files.staging, ...this.state.files.working];
        this.state.files.working = [];

        // Render Staging Files (Hidden initially)
        this.renderZone('working');
        this.renderZone('staging');

        // Animate Staging Files Appearance (Explosion/Pop)
        const stagingFiles = stagingZone.querySelectorAll('.file-item');
        stagingFiles.forEach((file, index) => {
            file.style.opacity = '0';
            file.style.transform = 'scale(0.5)';
            setTimeout(() => {
                file.animate([
                    { opacity: 0, transform: 'scale(0.5)' },
                    { opacity: 1, transform: 'scale(1)' }
                ], { duration: 300, easing: 'ease-out', fill: 'forwards' });
            }, index * 100);
        });

        anim.particles('explosion', stagingRect.left + stagingRect.width / 2, stagingRect.top + stagingRect.height / 2, {
            count: 30,
            colors: ['#00ff41', '#ffffff']
        });

        this.updateCommandStates();
        this.showInfo('Staged', '📦 All changes staged for commit.\n\nReady to commit snapshot.');
    }

    async cmdCommit() {
        if (this.state.files.staging.length === 0) {
            this.showInfo('Nothing to Commit', 'Staging area is empty.');
            return;
        }

        const msg = prompt("Enter commit message:", "Update project files");
        if (!msg) return;

        const anim = window.animEngine;
        const stagingZone = document.getElementById('zone-staging');
        const localZone = document.getElementById('zone-local');

        // Step 1: Freeze / Flash
        this.showInfo('Snapshot', '📸 Taking snapshot of staged files...');
        anim.flash('#ffffff', 150); // White flash

        // Step 2: Consolidate files to Disk Icon
        const files = stagingZone.querySelectorAll('.file-item');
        files.forEach(file => {
            file.style.transition = 'all 0.3s ease-in';
            file.style.transform = 'scale(0)';
            file.style.opacity = '0';
        });
        await anim.delay(300);

        // Step 3: Transfer to Local Repo (Disk rising)
        const stagingRect = stagingZone.getBoundingClientRect();
        const localRect = localZone.getBoundingClientRect();

        await anim.motionPath(null, stagingRect, localRect, {
            duration: 1000,
            icon: '💾',
            trail: true,
            rotation: 0,
            scale: [0.5, 1.2, 1],
            easing: 'ease-in-out'
        });

        // Step 4: Create Commit Node
        this.state.commitCount++;
        const newCommit = {
            id: Math.random().toString(16).substr(2, 7),
            message: msg,
            time: new Date().toLocaleTimeString(),
            files: [...this.state.files.staging]
        };

        this.state.files.local.push(newCommit);
        this.state.files.staging = [];

        this.renderAll();

        // Animate new commit appearing
        const commitEls = localZone.querySelectorAll('.file-item');
        const newCommitEl = commitEls[commitEls.length - 1];
        if (newCommitEl) {
            anim.particles('burst', newCommitEl.getBoundingClientRect().left + 20, newCommitEl.getBoundingClientRect().top + 20);
            newCommitEl.animate([
                { transform: 'scale(1.5)', backgroundColor: '#00ff41' },
                { transform: 'scale(1)', backgroundColor: 'transparent' }
            ], { duration: 400 });
        }

        this.showInfo('Commit Created', `💾 Commit created: ${newCommit.id}\n\n"${msg}"\n\nSnapshot saved to Local Repository.`);
        this.updateCommandStates();
    }

    async cmdPush() {
        if (this.state.files.local.length === 0) {
            this.showInfo('Nothing to Push', 'No commits in local repository.');
            return;
        }

        const anim = window.animEngine;
        const localZone = document.getElementById('zone-local');
        const remoteZone = document.getElementById('zone-remote');

        // Step 1: Prepare (Rocket pop-in)
        this.showInfo('Pushing', '🚀 Preparing to push commits to remote...');
        const localRect = localZone.getBoundingClientRect();

        // Step 2: Launch Sequence
        // Shake effect
        anim.shake(localZone, 5);
        await anim.delay(500);

        // Rocket Launch Animation (Local -> Remote)
        const remoteRect = remoteZone.getBoundingClientRect();

        await anim.motionPath(null, localRect, remoteRect, {
            duration: 1500,
            icon: '🚀',
            trail: true,
            rotation: 45,
            scale: [1, 1.5, 0.5],
            easing: 'cubic-bezier(0.45, 0, 0.55, 1)'
        });

        // Step 3: Arrival Explosion
        anim.particles('firework', remoteRect.left + remoteRect.width / 2, remoteRect.top + remoteRect.height / 2, {
            count: 40,
            colors: ['#00ff41', '#ffff00', '#ff6600'],
            spread: 150
        });

        // Data Update
        // Logic: Copy commits to remote
        // Find commits that are not in remote
        const localCommits = this.state.files.local;
        const remoteCommits = this.state.files.remote;
        const newCommits = localCommits.filter(c => !remoteCommits.some(rc => rc.id === c.id));

        this.state.files.remote = [...this.state.files.local];

        // Step 4: Progress Simulation
        this.showInfo('Uploading', '📤 Uploading objects: 100% (done)');
        await anim.delay(500);

        this.renderAll();

        // Highlight new commits in remote
        anim.glowPulse(remoteZone, '#00ff41');

        this.showInfo('Push Successful', `🚀 Pushed ${newCommits.length} new commits to origin/main`);
        this.updateCommandStates();
    }

    async cmdPull() {
        // Mock remote changes if empty
        if (this.state.files.remote.length <= this.state.files.local.length) {
            const mockCommit = {
                id: Math.random().toString(16).substr(2, 7),
                message: "Remote update",
                time: new Date().toLocaleTimeString(),
                files: []
            };
            this.state.files.remote.push(mockCommit);
        }

        const anim = window.animEngine;
        const remoteZone = document.getElementById('zone-remote');
        const localZone = document.getElementById('zone-local');
        const stagingZone = document.getElementById('zone-staging');
        const workingZone = document.getElementById('zone-working');

        // Step 1: Check updates
        this.showInfo('Pulling', '⬇️ Checking for updates on remote...');
        anim.glowPulse(remoteZone, '#00BFFF'); // Blue for remote
        await anim.delay(500);

        // Step 2: Download Arrow (Remote -> Local)
        const remoteRect = remoteZone.getBoundingClientRect();
        const localRect = localZone.getBoundingClientRect();

        await anim.motionPath(null, remoteRect, localRect, {
            duration: 800,
            icon: '⬇️',
            trail: true,
            rotation: 0,
            scale: [1, 1.2, 1],
            easing: 'ease-in-out'
        });

        // Data Update: Sync Local
        this.state.files.local = [...this.state.files.remote];
        this.renderZone('local');

        // Step 3: Local -> Staging (Cascade)
        const stagingRect = stagingZone.getBoundingClientRect();
        await anim.motionPath(null, localRect, stagingRect, {
            duration: 600,
            icon: '⬇️',
            trail: false,
            scale: [0.8, 0.8, 0.8]
        });

        // Step 4: Staging -> Working
        const workingRect = workingZone.getBoundingClientRect();
        await anim.motionPath(null, stagingRect, workingRect, {
            duration: 600,
            icon: '⬇️',
            trail: false,
            scale: [0.8, 0.8, 0.8]
        });

        // Final Sync
        this.showInfo('Merged', '♻️ Updates merged into working directory.');
        anim.glowPulse(workingZone, '#00ff41');

        this.renderAll();
        this.updateCommandStates();
    }

    async cmdReset(cmd) {
        if (this.state.files.local.length === 0) {
            this.showInfo('Reset', 'No commits to reset.');
            return;
        }

        const poppedCommit = this.state.files.local.pop(); // Remove last commit

        if (cmd === 'reset-hard') {
            // Destroy changes
            this.state.files.working = [];
            this.state.files.staging = [];
            this.showInfo('Reset Hard', `💥 Discarded commit ${poppedCommit.id} and all changes.`);
        } else if (cmd === 'reset-soft') {
            // Move to Staging
            this.state.files.staging.push(...poppedCommit.files);
            this.showInfo('Reset Soft', `🔙 Moved changes from ${poppedCommit.id} to Staging.`);
        } else {
            // Mixed (Default) - Move to Working
            this.state.files.working.push(...poppedCommit.files);
            this.showInfo('Reset (Mixed)', `🔙 Moved changes from ${poppedCommit.id} to Working Directory.`);
        }
        this.renderAll();
    }

    async cmdRevert() {
        if (this.state.files.local.length === 0) return;

        await this.animatePackage('zone-local', 'zone-local', '↺');
        this.state.commitCount++;
        const newCommit = {
            id: Math.random().toString(16).substr(2, 7),
            message: `Revert "Commit #${this.state.commitCount - 1}"`,
            files: []
        };
        this.state.files.local.push(newCommit);
        this.renderAll();
        this.showInfo('Revert', '↺ Created a new commit that undoes changes.');
    }

    async cmdStash(cmd) {
        const anim = window.animEngine;

        if (cmd === 'stash') {
            if (this.state.files.working.length === 0 && this.state.files.staging.length === 0) {
                this.showInfo('Stash', 'Nothing to stash.');
                return;
            }
            const stashItem = {
                id: this.state.stash.length,
                working: [...this.state.files.working],
                staging: [...this.state.files.staging]
            };
            this.state.stash.push(stashItem);

            // Clear workspace
            this.state.files.working = [];
            this.state.files.staging = [];

            await this.animatePackage('zone-working', 'infoBox', '📥'); // Visual effect
            this.renderAll();
            this.showInfo('Stashed', '💾 Saved working directory and info staging state.');

        } else if (cmd === 'stash-pop') {
            if (this.state.stash.length === 0) {
                this.showInfo('Stash', 'Stash is empty.');
                return;
            }
            const item = this.state.stash.pop();
            this.state.files.working = [...this.state.files.working, ...item.working];
            this.state.files.staging = [...this.state.files.staging, ...item.staging];

            await this.animatePackage('infoBox', 'zone-working', '📤');
            this.renderAll();
            this.showInfo('Stash Pop', '📤 Restored changes from stash.');

        } else if (cmd === 'stash-list') {
            // Drawer Animation
            this.showInfo('Stash', '💼 Opening Stash Drawer...');

            const drawer = document.createElement('div');
            drawer.style.cssText = `position:fixed; right:-300px; top:100px; bottom:100px; width:250px; background:#222; border-left:2px solid gold; z-index:9000; padding:10px; transition:right 0.5s; overflow-y:auto;`;
            document.body.appendChild(drawer);

            // Populate
            if (this.state.stash.length === 0) {
                drawer.innerHTML = '<div style="color:#666; text-align:center; margin-top:50px;">(Empty)</div>';
            } else {
                [...this.state.stash].reverse().forEach((s, i) => {
                    const item = document.createElement('div');
                    item.style.cssText = `background:#333; margin-bottom:5px; padding:10px; border-left:3px solid #00ff41; color:#fff; font-family:monospace;`;
                    item.innerHTML = `<strong>stash@{${i}}</strong><br><small>${s.working.length} files</small>`;
                    drawer.appendChild(item);
                });
            }

            // Slide in
            await new Promise(r => setTimeout(r, 10)); // Force reflow
            drawer.style.right = '0px';

            // Close auto
            setTimeout(() => {
                drawer.style.right = '-300px';
                setTimeout(() => drawer.remove(), 500);
            }, 4000);

            this.showInfo('Stash List', `📚 ${this.state.stash.length} stashed entries.`);

        } else if (cmd === 'stash-drop') {
            if (this.state.stash.length === 0) return;

            this.showInfo('Stash Drop', '🗑️ Dropping latest stash...');
            anim.particles('explosion', window.innerWidth - 100, window.innerHeight / 2, { colors: ['#555'] });
            this.state.stash.pop();
            this.showInfo('Stash Dropped', '🗑️ Stash dropped.');

        } else if (cmd === 'stash-clear') {
            if (this.state.stash.length === 0) {
                this.showInfo('Stash', 'Already empty.');
                return;
            }

            const confirmClear = confirm("⚠️ Clear ALL stashes? This cannot be undone.");
            if (!confirmClear) return;

            this.showInfo('Stash Clear', '⚠️ Clearing all stashes...');
            anim.shake(document.body, 20);

            const bin = document.createElement('div');
            bin.innerText = '🗑️';
            bin.style.cssText = `position:fixed; left:50%; top:50%; font-size:100px; transform:translate(-50%,-50%); z-index:9000;`;
            document.body.appendChild(bin);

            await anim.delay(1000);
            anim.particles('firework', window.innerWidth / 2, window.innerHeight / 2, { colors: ['red', 'orange'], count: 50 });
            bin.remove();

            this.state.stash = [];
            this.showInfo('Stash Cleared', '🗑️ All stashes destroyed.');
        } else {
            this.state.stash = [];
            this.showInfo('Stash Clear', '🗑️ All stashes dropped.');
        }
    }

    async cmdLog(cmd) {
        const anim = window.animEngine;
        const commits = this.state.files.local.slice().reverse();

        if (commits.length === 0) {
            this.showInfo('Git Log', 'No commits history.');
            return;
        }

        if (cmd === 'log-n') {
            this.showInfo('Log', '📜 Showing last 5 commits...');
            const localZone = document.getElementById('zone-local');
            const items = localZone.querySelectorAll('.file-item');
            if (items.length > 5) {
                for (let i = 0; i < items.length - 5; i++) {
                    items[i].style.opacity = '0.2';
                }
            }
            await anim.delay(300);

            let history = '';
            commits.slice(0, 5).forEach(c => history += `🔸 ${c.id} - ${c.message}\n`);
            this.showInfo('Git Log (-n 5)', history + '\n(Older commits hidden)');

        } else if (cmd === 'log-author') {
            const author = "User";
            this.showInfo('Log', `🔍 Filtering by author: ${author}...`);
            await anim.delay(500);
            this.showInfo('Git Log (--author)', `👤 Commits by ${author}:\n` + commits.map(c => `🔸 ${c.id} - ${c.message}`).join('\n'));

        } else if (cmd === 'log-grep') {
            const pattern = prompt("Enter search pattern:", "bug");
            if (!pattern) return;

            this.showInfo('Log Grep', `🔍 Searching history for "${pattern}"...`);
            const localZone = document.getElementById('zone-local');
            anim.glowPulse(localZone, 'yellow');
            await anim.delay(600);

            const matches = commits.filter(c => c.message && c.message.includes(pattern));
            if (matches.length > 0) {
                this.showInfo('Grep Matches', `🔍 Found ${matches.length} commits matching "${pattern}":\n` + matches.map(c => `🔸 ${c.id} - ${c.message}`).join('\n'));
            } else {
                this.showInfo('Grep Matches', `No commits found with pattern "${pattern}".`);
            }

        } else if (cmd === 'show') {
            const hash = prompt("Enter commit hash (or leave empty for HEAD):", "");
            const commit = hash ? commits.find(c => c.id === hash) : commits[0];

            if (!commit) { this.showInfo('Error', 'Commit not found.'); return; }

            this.showInfo('Show', `🔍 Loading details for ${commit.id}...`);
            const overlay = document.createElement('div');
            overlay.style.cssText = `position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:9000; display:flex; justify-content:center; align-items:center;`;

            const card = document.createElement('div');
            card.style.cssText = `background:#1a1a1a; border:1px solid #00ff41; padding:20px; border-radius:8px; width:400px; color:#00ff41; font-family:'Courier New'; box-shadow:0 0 20px #00ff41; transform:scale(0);`;
            card.innerHTML = `
                <h3>Commit ${commit.id}</h3>
                <p>👤 Author: ${this.state.user.name}</p>
                <p>📅 Date: ${new Date().toLocaleDateString()}</p>
                <p>💬 Message: "${commit.message}"</p>
                <hr style="border-color:#333"/>
                <div style="font-size:12px; height:100px; overflow:auto; background:#111; padding:5px;">
                   diff --git a/file b/file<br>
                   index 83db..f735<br>
                   <span style="color:#ff4444">- old line code</span><br>
                   <span style="color:#00ff41">+ new line code</span>
                </div>
                <button id="close-show-btn" style="margin-top:10px; background:#00ff41; color:#000; border:none; padding:5px 10px; cursor:pointer;">Close</button>
            `;
            overlay.appendChild(card);
            document.body.appendChild(overlay);

            await card.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 300 }).finished;

            card.querySelector('#close-show-btn').onclick = () => { overlay.remove(); };

        } else if (cmd === 'log-stat') {
            this.showInfo('Log Stat', '📊 Calculating statistics...');
            await anim.delay(500);

            // Expand cards visual simulation
            const localZone = document.getElementById('zone-local');
            anim.glowPulse(localZone, 'cyan');

            let output = '';
            commits.slice(0, 3).forEach(c => {
                output += `🔸 ${c.id} "${c.message}"\n   index.html | +12 --\n   style.css  | +5 -\n\n`;
            });
            this.showInfo('Git Log --stat', output + '(Showing last 3 for demo)');

        } else if (cmd === 'shortstat') {
            this.showInfo('Shortstat', '📊 Calculating...');
            await anim.delay(500);
            this.showInfo('Shortstat', '📊 3 files changed, 15 insertions(+), 3 deletions(-)');

        } else if (cmd === 'describe') {
            const tag = this.state.tags && this.state.tags.length > 0 ? this.state.tags[this.state.tags.length - 1].name : 'v1.0';
            const dist = Math.floor(Math.random() * 5) + 1;
            const hash = 'a' + Math.random().toString(16).substr(2, 7);

            this.showInfo('Describe', `📍 Analyzing distance from ${tag}...`);

            // Draw line visual (mock)
            const line = document.createElement('div');
            line.style.cssText = `position:fixed; bottom:150px; left:20%; width:0%; height:2px; background:gold; z-index:9000; transition:width 1s; box-shadow:0 0 5px gold;`;
            document.body.appendChild(line);

            await new Promise(r => setTimeout(r, 10));
            line.style.width = '200px';
            await anim.delay(1000);
            line.remove();

            this.showInfo('Describe', `📍 ${tag}-${dist}-g${hash}\n\nTag: ${tag}\nCommits: ${dist} ahead`);
        } else {
            let history = '';
            commits.forEach(c => history += `🔸 ${c.id} - ${c.message}\n`);
            this.showInfo('Git Log', history);
        }
    }

    async cmdBlame() {
        this.showInfo('Blame', '🔍 Analyzing file history...');
        const anim = window.animEngine;
        await anim.delay(500);

        const content = `
1234a (Ahmet)  <h1>Title</h1>
5678b (Mehmet) <p>Content</p>
9012c (Ali)    </div>
        `;
        this.showInfo('Git Blame - index.html', content);
    }

    async cmdReflog() {
        this.showInfo('Reflog', '🔍 Scanning HEAD history...');
        const content = `
HEAD@{0}: commit: New feature
HEAD@{1}: checkout: moving from main to feature
HEAD@{2}: reset: moving to HEAD~1
HEAD@{3}: commit: Wip
        `;
        this.showInfo('Reflog', content + '\n(Visual ghost commits enabled)');
    }

    async cmdBisect() {
        const start = confirm("Start binary search for bug?");
        if (!start) return;

        this.showInfo('Bisect', '🎯 Bisect started. range: 14 commits.');

        let commits = 14;
        while (commits > 1) {
            const isGood = confirm(`Testing commit (remaining: ${commits}). Is this commit GOOD?`);
            commits = Math.floor(commits / 2);
            this.showInfo('Bisect', `Testing... ${commits} commits remaining.`);
            await window.animEngine.delay(500);
        }

        this.showInfo('Bisect Found', '🎯 Bug found in commit abc123!');
        window.animEngine.particles('firework', window.innerWidth / 2, window.innerHeight / 2, { colors: ['red'] });
    }

    async cmdShortlog() {
        const stats = `
👤 ${this.state.user.name} (12 commits)
👤 Contributor2 (3 commits)
        `;
        this.showInfo('Shortlog', stats);
    }

    async cmdGrep() {
        const pattern = prompt("Enter search pattern:", "TODO");
        if (!pattern) return;
        this.showInfo('Grep', `🔍 Searching files for "${pattern}"...`);
        await window.animEngine.delay(800);
        this.showInfo('Grep Result', `📄 index.html:45: // TODO: fixing visuals\n📄 app.js:12: // TODO: refactor`);
    }

    async cmdTag(cmd) {
        const anim = window.animEngine;

        if (cmd === 'tag-create') {
            // Animated Input Modal
            const tagName = prompt("Enter tag name:", "v1.0.0");
            if (!tagName) return;
            const msg = prompt("Enter tag message:", "Release 1.0");

            this.showInfo('Creating Tag', `🏷️ Generating annotated tag "${tagName}"...`);

            // Animation: Tag Creation (Scale, Bounce, Glow)
            const localZone = document.getElementById('zone-local');
            const headCommit = localZone.lastElementChild;

            if (headCommit) {
                const rect = headCommit.getBoundingClientRect();
                // Spawn tag icon
                const tagEl = document.createElement('div');
                tagEl.innerHTML = '🏷️';
                tagEl.style.cssText = `
                    position: fixed;
                    left: ${rect.left + 20}px;
                    top: ${rect.top - 20}px;
                    font-size: 24px;
                    transform: scale(0);
                    z-index: 10000;
                    filter: drop-shadow(0 0 10px gold);
                `;
                document.body.appendChild(tagEl);

                // Scale 0 -> 1.3 -> 1
                await tagEl.animate([
                    { transform: 'scale(0)' },
                    { transform: 'scale(1.3)' },
                    { transform: 'scale(1)' }
                ], { duration: 600, easing: 'ease-out' }).finished;

                // Add message bubble
                const bubble = document.createElement('div');
                bubble.innerText = msg;
                bubble.className = 'particle';
                bubble.style.cssText = `
                    background: #333; color: #fff; padding: 5px 10px; border-radius: 10px;
                    font-size: 12px; left: ${rect.left + 50}px; top: ${rect.top - 40}px;
                    border: 1px solid gold; opacity: 0;
                `;
                document.body.appendChild(bubble);

                // Fade in bubble then out
                await bubble.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 300 }).finished;
                await anim.delay(1000);
                bubble.animate([{ opacity: 0 }], { duration: 300 }).onfinish = () => bubble.remove();

                // Premium Effect: Diamond sparkles
                anim.particles('sparkle', rect.left + 30, rect.top, { color: '#ffffff', count: 10 });
                anim.particles('sparkle', rect.left + 30, rect.top, { color: 'gold', count: 10 });

                tagEl.remove(); // Remove temporary visual, real data will render
            }

            this.state.tags = this.state.tags || [];
            this.state.tags.push({ name: tagName, msg: msg, commit: 'HEAD' });

            this.showInfo('Tag Created', `🏷️ Annotated tag '${tagName}' created\n\nAuthor: User\nDate: ${new Date().toLocaleDateString()}\nMessage: "${msg}"`);

        } else if (cmd === 'push-tags') {
            if (!this.state.tags || this.state.tags.length === 0) {
                this.showInfo('Error', 'No tags to push.');
                return;
            }

            this.showInfo('Pushing Tags', '📦 Collecting tags...');

            // Animation: Collecting tags into package
            const localZone = document.getElementById('zone-local');
            const remoteZone = document.getElementById('zone-remote');

            // Pulse current tags
            anim.glowPulse(localZone, 'gold');
            await anim.delay(500);

            // Rocket Transfer
            const localRect = localZone.getBoundingClientRect();
            const remoteRect = remoteZone.getBoundingClientRect();

            await anim.motionPath(null, localRect, remoteRect, {
                duration: 1500,
                icon: '🚀📦',
                trail: true,
                rotation: 0,
                scale: [1, 1.2, 0.5]
            });

            // Explosion at remote
            anim.particles('firework', remoteRect.left + remoteRect.width / 2, remoteRect.top, { colors: ['gold', 'red', 'white'] });

            this.showInfo('Tags Pushed', `🏷️🚀 ${this.state.tags.length} tags pushed to remote!\nGitHub releases created.`);

        } else if (cmd === 'tag-delete') {
            const tagName = prompt("Enter tag to delete:", "v1.0.0");
            if (!this.state.tags || !this.state.tags.find(t => t.name === tagName)) {
                this.showInfo('Error', 'Tag not found.');
                return;
            }

            // Animation: Rip effect
            this.showInfo('Deleting Tag', `🗑️ Deleting ${tagName}...`);
            const localZone = document.getElementById('zone-local');
            anim.shake(localZone, 5);

            // Simulate paper tear particles
            const rect = localZone.getBoundingClientRect();
            anim.particles('confetti', rect.left + 50, rect.top + 50, { colors: ['#eee'], count: 20 }); // simple confetti as tear pieces

            this.state.tags = this.state.tags.filter(t => t.name !== tagName);
            await anim.delay(600);

            this.showInfo('Tag Deleted', `🗑️ Tag '${tagName}' deleted locally.`);

        } else if (cmd === 'push-delete-tag') {
            const tagName = prompt("Enter remote tag to delete:", "v1.0.0");
            // Animation: Remote trash
            this.showInfo('Deleting Remote Tag', 'Connecting to remote...');
            const remoteZone = document.getElementById('zone-remote');
            anim.glowPulse(remoteZone, 'red');
            await anim.delay(500);

            // Trash icon appears
            const icon = document.createElement('div');
            icon.innerHTML = '🗑️';
            const rRect = remoteZone.getBoundingClientRect();
            icon.style.cssText = `position:fixed; left:${rRect.left + 50}px; top:${rRect.top + 20}px; font-size:30px; z-index:9999;`;
            document.body.appendChild(icon);

            await icon.animate([{ opacity: 0, transform: 'scale(0)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 400 }).finished;
            await anim.delay(500);
            icon.remove();

            this.showInfo('Remote Tag Deleted', `🗑️ Remote tag '${tagName}' deleted.\nGitHub release removed.`);
        } else {
            // List
            const list = (this.state.tags || []).map(t => `🏷️ ${t.name}: ${t.msg}`).join('\n') || "No tags.";
            this.showInfo('Tag List', list);
        }
    }

    cmdConfig(cmd) {
        if (cmd === 'config-list') {
            const content = `📋 USER
  user.name = "${this.state.user.name}"
  user.email = "${this.state.user.email}"

🎨 CORE
  core.editor = "code"
  core.autocrlf = true

🌐 REMOTE
  remote.origin.url = "github.com/user/project.git"`;
            this.showInfo('Git Configuration', content);

            // Animation: Slide in "panel" (mocked via info box)
            // Just basic info for now, as real layout change is complex without HTML change.
        } else if (cmd === 'config-alias') {
            const alias = prompt("AliasShortcut:", "co");
            const command = prompt("Command:", "checkout");
            if (alias && command) {
                this.showInfo('Alias Created', `⚡ Alias '${alias}' created for '${command}'.\n\nYou can now use 'git ${alias}'!`);
                // Animation: Lightning
                /* No specific flash here, simple info */
            }
        } else if (cmd === 'config-user') {
            const name = prompt("Enter your user.name:", this.state.user.name);
            if (name) {
                this.state.user.name = name;
                this.showInfo('Config Updated', `👤 User name set to: ${name}`);
            }
        } else {
            this.showInfo('Config', '⚙️ Alias/Other config simulation.');
        }
    }

    async cmdFetch() {
        await this.animatePackage('zone-remote', 'zone-local', '☁️');
        this.showInfo('Fetch Complete', '📥 Fetched latest information from remote.');
    }

    async cmdAdvancedOps(cmd) {
        const anim = window.animEngine;
        const localZone = document.getElementById('zone-local');

        if (cmd === 'cherry-pick') {
            const hash = prompt("Enter commit hash to cherry-pick:", "a1b2c3d");
            if (!hash) return;

            this.showInfo('Cherry Pick', `🍒 Picking commit ${hash}...`);
            // Animation
            const cherry = document.createElement('div');
            cherry.innerHTML = '🍒';
            cherry.style.cssText = `position:fixed; left:100px; top:100px; font-size:30px; z-index:9000;`;
            document.body.appendChild(cherry);

            const rect = localZone.getBoundingClientRect();
            await anim.motionPath(cherry, { left: 100, top: 100, width: 0, height: 0 }, rect, { duration: 1000, icon: '🍒' });
            cherry.remove();

            // Add commit
            this.state.commitCount++;
            const newCommit = {
                id: Math.random().toString(16).substr(2, 7),
                message: `Cherry-pick ${hash}`,
                files: []
            };
            this.state.files.local.push(newCommit);
            this.renderAll();
            this.showInfo('Cherry Pick', `🍒 Applied commit ${hash} to current branch.`);

        } else if (cmd === 'rebase' || cmd === 'rebase-i') {
            this.showInfo('Rebase', 'Interactive Rebase Editor opened.');
            // Mock Editor
            const choice = prompt("Interactive Rebase (Head~3):\n1. Pick\n2. Squash\n3. Drop", "1");
            if (choice === '2') {
                // Animation: Squash
                this.showInfo('Rebase', 'Squashing commits...');
                anim.flash('#ffff00', 300);
                // Remove one commit for visual effect
                if (this.state.files.local.length > 1) this.state.files.local.pop();
                this.renderAll();
            }
            this.showInfo('Rebase Success', '🏗️ Successfully rebased and updated refs.');

        } else if (cmd === 'submodule') {
            // Mock submodule add
            const url = prompt("Enter submodule URL:", "github.com/lib/utils");
            this.showInfo('Submodule', `📦 Cloning ${url}...`);
            await anim.delay(1000);
            this.showInfo('Submodule', `📦 Submodule added.\n\n[submodule "lib/utils"]\n  path = lib/utils`);

        } else if (cmd === 'worktree') {
            this.showInfo('Worktree', '🌳 Creating secondary worktree...');
            // Split effect Mock
            document.body.style.borderLeft = "5px solid #00ff41";
            setTimeout(() => document.body.style.borderLeft = "none", 2000);
            this.showInfo('Worktree', '🌳 Worktree created at ../feature-branch');

        } else if (cmd === 'archive') {
            this.showInfo('Archive', '📦 Compressing files...');
            await anim.delay(1000);
            this.showInfo('Archive', '📦 project.zip created (12.4 MB).');

        } else if (cmd === 'gc') {
            this.showInfo('GC', '🧹 Exploring loose objects...');
            await anim.delay(800);
            this.showInfo('GC', '🧹 Packing objects... Done.\nSize reduced by 40%.');

        } else if (cmd === 'fork') {
            this.cmdFork();
        } else if (cmd === 'pr') {
            this.cmdPR();
        } else {
            // Generic Fallback
            this.showInfo('Command', `Command ${cmd} executed.`);
        }
    }

    async cmdFork() {
        const anim = window.animEngine;
        this.showInfo('Fork', '🍴 Forking repository (Upstream -> Origin)...');

        // Animation: Split
        const remoteZone = document.getElementById('zone-remote');
        anim.glowPulse(remoteZone, '#00ff41');
        await anim.delay(500);

        // Icon growing
        const forkIcon = document.createElement('div');
        forkIcon.innerText = '🍴';
        forkIcon.style.cssText = `position:fixed; left:50%; top:50%; font-size:10px; transform:translate(-50%,-50%); z-index:9000; transition:all 0.5s;`;
        document.body.appendChild(forkIcon);

        // Grow
        await new Promise(r => setTimeout(r, 10));
        forkIcon.style.fontSize = '80px';
        await anim.delay(600);

        // Populate Origin from Upstream (Mock)
        this.state.remotes.origin = [...this.state.files.remote]; // Clone current remote state
        this.state.activeRemote = 'origin';
        this.state.files.remote = this.state.remotes.origin;
        this.showInfo('Fork', 'Synced Origin with Upstream.');

        // Duplicate Effect Visual
        const clone = remoteZone.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.top = remoteZone.getBoundingClientRect().top + 'px';
        clone.style.left = remoteZone.getBoundingClientRect().left + 'px';
        clone.style.zIndex = 8000;
        clone.style.opacity = 0.5;
        document.body.appendChild(clone);

        // Move clone to right (simulate new remote creation)
        await clone.animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(200px) scale(0.9)' },
            { transform: 'translateX(0) scale(1)' } // Snap back as we switch view
        ], { duration: 1200 }).finished;

        clone.remove();
        forkIcon.remove();

        this.renderAll(); // Will render Origin now
        this.showInfo('Fork Success', '🍴 Fork created!\n\nSwitched view to "origin".\nUpstream is still available.');
        anim.particles('confetti', window.innerWidth / 2, window.innerHeight / 2, { colors: ['#00ff41'] });
    }

    async cmdPR() {
        if (this.state.activeRemote !== 'origin') {
            const switchRemote = confirm("You are on 'upstream'. Switch to 'origin' to create PR?");
            if (switchRemote) {
                this.state.activeRemote = 'origin';
                this.state.files.remote = this.state.remotes.origin;
                this.renderAll();
            } else {
                return;
            }
        }

        const title = prompt("PR Title:", "Feature Update");
        if (!title) return;

        const anim = window.animEngine;
        this.showInfo('Pull Request', `📝 Creating PR "${title}" from origin -> upstream...`);

        const remote = document.getElementById('zone-remote');
        const rRect = remote.getBoundingClientRect();

        // 1. Push to Origin Logic (simplified)
        // 2. Fly to Upstream (Visual)

        // Paper plane animation
        const plane = document.createElement('div');
        plane.innerText = '📝';
        const start = document.getElementById('zone-local').getBoundingClientRect();

        plane.style.cssText = `position:fixed; left:${start.left}px; top:${start.top}px; font-size:30px; z-index:9000;`;
        document.body.appendChild(plane);

        // Complex Path: Local -> Origin (Current View) -> Upstream (Imaginary/Tab)
        await anim.motionPath(plane, start, rRect, { duration: 1000, icon: '📝' });

        // Disappear "into" upstream
        await plane.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0) translateY(-50px)' }], { duration: 500 }).finished;
        plane.remove();

        // Celebration
        anim.particles('firework', rRect.left + rRect.width / 2, rRect.top, { colors: ['#58a6ff', 'gold'] });

        this.showInfo('PR Created', `✅ Pull Request #${Math.floor(Math.random() * 100)} sent to Upstream.\n\n"${title}"\nStatus: Open`);
    }

    // Helper to toggle remotes
    toggleRemote() {
        if (this.state.activeRemote === 'origin') {
            this.state.activeRemote = 'upstream';
            this.state.files.remote = this.state.remotes.upstream || [];
        } else {
            this.state.activeRemote = 'origin';
            this.state.files.remote = this.state.remotes.origin || [];
        }
        this.renderAll();
        const anim = window.animEngine;
        if (anim) anim.glowPulse(document.getElementById('zone-remote'), this.state.activeRemote === 'origin' ? '#00ff41' : '#58a6ff');
        this.showInfo('Remote Switch', `Switched to remote: ${this.state.activeRemote}`);
    }

    // UI Helpers
    createBranchInput() {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.style.cssText = `position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:10000; display:flex; justify-content:center; align-items:center;`;

            const container = document.createElement('div');
            container.style.cssText = `background:#0d1117; padding:20px; border:1px solid #00ff41; border-radius:10px; text-align:center; box-shadow:0 0 30px rgba(0,255,65,0.2);`;

            const label = document.createElement('div');
            label.innerText = '🌿 New Branch Name:';
            label.style.color = '#00ff41';
            label.style.marginBottom = '10px';

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'branch-input';
            input.placeholder = 'feature/my-awesome-feature';
            input.autofocus = true;

            const hint = document.createElement('div');
            hint.innerText = 'Tip: Use kebab-case (e.g. fix-login)';
            hint.style.cssText = `font-size:12px; color:#8b949e; margin-top:10px;`;

            const btn = document.createElement('button');
            btn.innerText = 'Create Branch';
            btn.style.cssText = `margin-top:15px; padding:8px 20px; background:#238636; color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:bold;`;

            container.appendChild(label);
            container.appendChild(input);
            container.appendChild(hint);
            container.appendChild(document.createElement('br'));
            container.appendChild(btn);
            overlay.appendChild(container);
            document.body.appendChild(overlay);

            input.focus();

            const submit = () => {
                const val = input.value.trim();
                if (val) {
                    overlay.remove();
                    resolve(val);
                }
            };

            btn.onclick = submit;
            input.onkeydown = (e) => { if (e.key === 'Enter') submit(); else if (e.key === 'Escape') { overlay.remove(); resolve(null); } };

            overlay.onclick = (e) => {
                if (e.target === overlay) { overlay.remove(); resolve(null); }
            };
        });
    }

    createContextMenu(items, callback) {
        const menu = document.createElement('div');
        menu.className = 'ctx-menu';

        items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'ctx-item';
            el.innerHTML = `<span>${item.includes('*') ? '🌿' : '📄'}</span> ${item}`;
            el.onclick = () => {
                menu.remove();
                callback(item);
            };
            menu.appendChild(el);
        });

        const rect = document.getElementById('zone-local').getBoundingClientRect(); // Position near local zone
        menu.style.left = (rect.left + 50) + 'px';
        menu.style.top = (rect.top + 50) + 'px';

        document.body.appendChild(menu);

        // Click outside to close
        setTimeout(() => {
            const closer = (e) => {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closer);
                }
            };
            document.addEventListener('click', closer);
        }, 100);
    }
    cmdRemote(cmd) {
        if (cmd === 'remote-v') {
            const content = `
origin  https://github.com/user/repo.git (fetch)
origin  https://github.com/user/repo.git (push)
             `;
            this.showInfo('Remote -v', content);
        } else {
            this.state.remoteConnected = true;
            this.showInfo('Remote Added', '🌐 Added remote "origin" pointing to GitHub/GitLab.');
        }
    }

    async cmdClean() {
        if (this.state.files.working.length === 0) {
            this.showInfo('Clean', '✨ Working directory is already clean.');
            return;
        }
        // Filter out untracked files? In this demo all in working are basically 'untracked' or 'modified'
        // Let's just clear the working directory for visual effect
        this.state.files.working = [];
        this.renderAll();
        this.showInfo('Clean', '🧹 Removed untracked files from working directory.');
    }

    async cmdRestore(cmd) {
        if (cmd === 'restore-staged') {
            if (this.state.files.staging.length === 0) {
                this.showInfo('Restore', 'Nothing to restore in staging.');
                return;
            }
            // Move from Staging back to Working
            await this.animatePackage('zone-staging', 'zone-working', '🔙');
            this.state.files.working.push(...this.state.files.staging);
            this.state.files.staging = [];
            this.renderAll();
            this.showInfo('Restore', '🔙 Unstaged changes (moved back to Working Directory).');
        } else {
            // Discard changes in working
            if (this.state.files.working.length === 0) {
                this.showInfo('Restore', 'Working directory is clean.');
                return;
            }
            this.state.files.working = [];
            this.renderAll();
            this.showInfo('Restore', '🗑️ Discarded changes in working directory.');
        }
    }



    cmdStatus() {
        const working = this.state.files.working.length;
        const staging = this.state.files.staging.length;

        let status = `On branch ${this.state.branch}\n\n`;
        if (working === 0 && staging === 0) {
            status += 'nothing to commit, working tree clean';
        } else {
            if (staging > 0) status += `Changes to be committed: (${staging} files)\n`;
            if (working > 0) status += `Changes not staged for commit: (${working} files)\n`;
        }

        if (working > 0) {
            const zone = document.getElementById('zone-working');
            if (zone && window.animEngine) window.animEngine.glowPulse(zone, '#ff4444');
        }
        if (staging > 0) {
            const zone = document.getElementById('zone-staging');
            if (zone && window.animEngine) window.animEngine.glowPulse(zone, '#00ff41');
        }

        this.showInfo('Git Status', status);
    }

    async cmdBranch(cmd) {
        if (cmd === 'branch-list') {
            const list = this.state.branches.map(b => b === this.state.branch ? `* ${b}` : `  ${b}`).join('\n');
            this.showInfo('Branch List', list);
            return;
        }

        if (cmd === 'branch-create') {
            const name = await this.createBranchInput();
            if (!name) return;
            if (this.state.branches.includes(name)) {
                this.showInfo('Error', `Branch "${name}" already exists.`);
                return;
            }

            const anim = window.animEngine;
            this.showInfo('Branch', `🌿 Creating branch "${name}"...`);

            const localZone = document.getElementById('zone-local');
            const headCommit = localZone.lastElementChild;
            if (headCommit && anim) {
                const rect = headCommit.getBoundingClientRect();
                anim.particles('sparkle', rect.left + rect.width / 2, rect.top + rect.height / 2, { color: '#00ff41' });
            }

            this.state.branches.push(name);
            if (anim) await anim.delay(500);

            this.renderBranches();
            this.showInfo('Branch Created', `🌿 Branch "${name}" created from ${this.state.branch}`);
        } else if (cmd === 'branch-delete') {
            const name = prompt("Enter branch name to delete:", "");
            if (!name) return;
            if (name === this.state.branch) {
                this.showInfo('Error', 'Cannot delete currently active branch.');
                return;
            }
            if (!this.state.branches.includes(name)) {
                this.showInfo('Error', 'Branch not found.');
                return;
            }
            this.state.branches = this.state.branches.filter(b => b !== name);
            this.renderBranches();
            this.showInfo('Branch Deleted', `🗑️ Branch "${name}" deleted.`);
        }
    }

    async cmdCheckout(cmd) {
        let targetBranch;
        if (cmd === 'checkout-b') {
            const name = prompt("Enter new branch name to create and switch to:", "feature-new");
            if (!name) return;
            if (this.state.branches.includes(name)) {
                this.showInfo('Error', `Branch "${name}" already exists.`);
                return;
            }
            this.state.branches.push(name);
            targetBranch = name;
        } else {
            targetBranch = prompt("Enter branch to checkout:", this.state.branches.find(b => b !== this.state.branch) || "main");
        }

        if (!targetBranch) return;
        if (!this.state.branches.includes(targetBranch)) {
            this.showInfo('Error', `Branch "${targetBranch}" not found.`);
            return;
        }
        if (targetBranch === this.state.branch) {
            this.showInfo('Checkout', `Already on branch "${targetBranch}".`);
            return;
        }

        const anim = window.animEngine;
        this.showInfo('Checkout', `SWITCHING to "${targetBranch}"...`);

        document.body.style.transition = 'filter 0.3s ease';
        document.body.style.filter = 'blur(4px) brightness(0.8)';

        if (anim) await anim.delay(300);

        this.state.branch = targetBranch;

        const workingZone = document.getElementById('zone-working');
        workingZone.style.transition = 'opacity 0.2s';
        workingZone.style.opacity = '0';

        if (anim) await anim.delay(200);

        this.renderAll();

        workingZone.style.opacity = '1';
        document.body.style.filter = 'none';

        if (anim) await anim.delay(300);
        this.showInfo('Checked Out', `Switched to branch "${targetBranch}"\n\nHEAD is now at ${targetBranch}`);
    }

    async cmdMerge(cmd) {
        if (this.state.files.local.length === 0) {
            this.showInfo('Error', 'No commits to merge.');
            return;
        }

        const sourceBranch = prompt("Enter branch to merge into current:", "feature-login");
        if (!sourceBranch) return;
        if (!this.state.branches.includes(sourceBranch)) {
            this.showInfo('Error', `Branch "${sourceBranch}" not found.`);
            return;
        }
        if (sourceBranch === this.state.branch) {
            this.showInfo('Error', 'Cannot merge branch into itself.');
            return;
        }

        const anim = window.animEngine;
        this.showInfo('Merging', `🔀 Merging "${sourceBranch}" into "${this.state.branch}"...`);

        const localZone = document.getElementById('zone-local');

        const rect = localZone.getBoundingClientRect();

        const ghost = document.createElement('div');
        ghost.className = 'file-item';
        ghost.textContent = '🌿 ' + sourceBranch;
        ghost.style.cssText = `
            position: fixed;
            top: ${rect.top + 50}px;
            left: ${rect.left - 100}px;
            background: #333;
            border: 1px solid #00ff41;
            padding: 10px;
            z-index: 9999;
        `;
        document.body.appendChild(ghost);

        if (anim) {
            await anim.motionPath(ghost, ghost.getBoundingClientRect(), {
                left: rect.left + rect.width / 2 - 20,
                top: rect.bottom - 50,
                width: 0, height: 0
            }, { duration: 800, easing: 'ease-in' });

            ghost.remove();
            anim.flash('#00ff41', 100);
        } else {
            ghost.remove();
        }

        this.state.commitCount++;
        const newCommit = {
            id: Math.random().toString(16).substr(2, 7),
            message: `Merge branch '${sourceBranch}'`,
            time: new Date().toLocaleTimeString(),
            files: []
        };
        this.state.files.local.push(newCommit);

        this.renderAll();

        const commits = localZone.querySelectorAll('.file-item');
        const last = commits[commits.length - 1];
        if (last && anim) {
            anim.glowPulse(last, '#ffff00', 3);
        }

        this.showInfo('Merge Complete', `🔀 Merge made by the 'recursive' strategy.\n${sourceBranch} merged into ${this.state.branch}`);
    }

    cmdDiff(cmd) {
        const title = cmd === 'diff-staged' ? 'Diff (Staged)' : 'Diff (Working)';
        const diffContent = `diff --git a/app.js b/app.js
index 83db48f..f735c2d 100644
--- a/app.js
+++ b/app.js
@@ -1,4 +1,5 @@
 function init() {
-  console.log('Init');
+  console.log('Hello World');
+  startApp();
 }`;
        this.showInfo(title, diffContent);
    }

    async cmdFileOps(cmd) {
        const anim = window.animEngine;

        if (cmd === 'mv') {
            const oldName = prompt("Enter file to rename (mock):", "old.txt");
            if (!oldName) return;
            const newName = prompt("Enter new name:", "new.txt");
            if (!newName) return;

            this.showInfo('Move', `📝 Renaming ${oldName} to ${newName}...`);

            // Animation: Morph text
            const label = document.createElement('div');
            label.innerText = oldName;
            label.style.cssText = `position:fixed; left:50%; top:50%; color:#fff; font-size:24px; transform:translate(-50%, -50%);`;
            document.body.appendChild(label);

            await anim.delay(500);
            label.style.transition = 'opacity 0.2s';
            label.style.opacity = 0;
            await anim.delay(200);
            label.innerText = newName;
            label.style.opacity = 1;
            await anim.delay(500);
            label.animate([{ transform: 'translate(-50%,-50%) scale(1)' }, { transform: 'translate(-50%,-50%) scale(0)' }], { duration: 300 }).finished;
            label.remove();

            this.showInfo('Renamed', `📝 ${oldName} -> ${newName} (staged)`);

        } else if (cmd === 'rm') {
            const file = prompt("Enter file to delete:", "test.txt");
            if (!file) return;

            this.showInfo('Remove', `🗑️ Deleting ${file}...`);
            // Animation: Crumple
            const item = document.createElement('div');
            item.style.cssText = `position:fixed; left:50%; top:50%; width:100px; height:120px; background:#eee; transform:translate(-50%,-50%);`;
            document.body.appendChild(item);

            await item.animate([
                { transform: 'translate(-50%,-50%) scale(1) rotate(0deg)' },
                { transform: 'translate(-50%,-50%) scale(0.1) rotate(720deg)' }
            ], { duration: 600 }).finished;
            item.remove();

            // Puff
            anim.particles('firework', window.innerWidth / 2, window.innerHeight / 2, { colors: ['#888'], count: 10 });
            this.showInfo('Removed', `🗑️ ${file} deleted.`);

        } else if (cmd === 'ls-files') {
            this.showInfo('Ls-Files', '📋 Tracked files:\n✅ index.html\n✅ app.js\n✅ styles.css');
        }
    }

    async cmdPatch(cmd) {
        const anim = window.animEngine;

        if (cmd === 'apply') {
            this.showInfo('Apply Patch', '📄 Analyzing patch...');
            await anim.delay(500);

            // Preview
            const preview = document.createElement('div');
            preview.style.cssText = `position:fixed; left:50%; top:50%; transform:translate(-50%,-50%); background:#222; padding:20px; border:1px solid gold; font-family:monospace;`;
            preview.innerHTML = `<span style="color:green">+ class Patch {</span><br><span style="color:red">- class Old {</span>`;
            document.body.appendChild(preview);

            await anim.delay(1000);
            preview.remove();

            anim.flash('#00ff41', 200);
            this.showInfo('Patch Applied', '✅ Patch successfully applied.');

        } else if (cmd === 'format-patch') {
            this.showInfo('Format Patch', '📄 Generating patch from HEAD...');
            await anim.delay(600);

            // File generation animation
            const file = document.createElement('div');
            file.innerText = '0001-feat.patch';
            file.style.cssText = `position:fixed; left:50%; top:40%; color:#fff; font-size:40px; opacity:0;`;
            document.body.appendChild(file);

            await file.animate([{ top: '40%', opacity: 0 }, { top: '50%', opacity: 1 }], { duration: 500 }).finished;
            await anim.delay(500);
            file.remove();

            this.showInfo('Patch Created', '💾 Created 0001-feat.patch');

        } else if (cmd === 'rebase-continue') {
            this.showInfo('Rebase', '♻️ Continuing rebase...');
            // Progress bar simulation
            for (let i = 1; i <= 3; i++) {
                this.showInfo('Rebase', `Applying commit ${i}/3...`);
                await anim.delay(400);
            }
            this.showInfo('Rebase Done', '✅ Rebase completed successfully.');

        } else if (cmd === 'rebase-abort') {
            this.showInfo('Rebase', '⚠️ Aborting rebase...');
            anim.shake(document.body, 10);
            // Rewind
            this.showInfo('Rebase', '⏪ Rolling back changes...');
            await anim.delay(800);
            this.showInfo('Rebase Aborted', '⏪ Returned to original state.');
        }
    }

    // --- Rendering ---

    renderAll() {
        this.renderZone('working');
        this.renderZone('staging');
        this.renderZone('local');
        this.renderZone('remote');
        this.renderBranches();
        this.updateCommandStates();
    }

    renderBranches() {
        if (!this.branchViz) return;
        this.branchViz.innerHTML = '';

        if (!this.state.initialized) {
            this.branchViz.style.display = 'none';
            return;
        }
        this.branchViz.style.display = 'flex';

        this.state.branches.forEach(branch => {
            const el = document.createElement('div');
            const isActive = branch === this.state.branch;
            el.className = `branch-pill ${isActive ? 'active' : ''}`;
            el.innerHTML = `<i class="ph ph-git-branch"></i> ${branch}`;

            // Allow clicking to switch? (Enhancement)
            // el.onclick = () => this.executeCommand('checkout', null, branch); 

            this.branchViz.appendChild(el);
        });
    }

    getSuggestedCommand() {
        // If a scenario is active, the scenario controls suggestions
        if (this.activeScenario && this.currentStepIndex < this.activeScenario.steps.length) {
            return this.activeScenario.steps[this.currentStepIndex].cmd;
        }

        const state = this.state;
        if (!state.initialized) return 'init';
        if (state.files.working.length > 0 && state.files.staging.length === 0) return 'add-all';
        if (state.files.staging.length > 0 && state.files.local.length === 0) return 'commit';
        if (state.files.staging.length > 0) return 'commit';
        if (state.files.local.length > 0 && state.files.remote.length === 0) return 'push';
        if (state.files.local.length > state.files.remote.length) return 'push';
        return null;
    }

    updateCommandStates() {
        const state = this.state;
        const suggested = this.getSuggestedCommand();

        document.querySelectorAll('.cmd-btn').forEach(btn => {
            const cmd = btn.dataset.cmd;
            btn.classList.remove('error', 'available', 'suggested');

            let isAvailable = true;
            let requiresInit = true;

            const noInitRequired = ['init', 'clone', 'config-user', 'config-list', 'alias'];
            if (noInitRequired.includes(cmd)) {
                requiresInit = false;
            }

            if (requiresInit && !state.initialized) {
                isAvailable = false;
            }

            if (state.initialized) {
                switch (cmd) {
                    case 'init':
                        isAvailable = false;
                        break;
                    case 'add-all':
                    case 'add-file':
                        isAvailable = state.files.working.length > 0;
                        break;
                    case 'commit':
                    case 'commit-am':
                        isAvailable = state.files.staging.length > 0;
                        break;
                    case 'push':
                    case 'push-u':
                    case 'push-tags':
                        isAvailable = state.files.local.length > 0;
                        break;
                    case 'reset':
                    case 'reset-soft':
                    case 'reset-hard':
                    case 'revert':
                    case 'log':
                    case 'log-oneline':
                    case 'log-graph':
                    case 'show':
                        isAvailable = state.files.local.length > 0;
                        break;
                    case 'restore-staged':
                        isAvailable = state.files.staging.length > 0;
                        break;
                    case 'restore':
                    case 'clean':
                    case 'diff':
                        isAvailable = state.files.working.length > 0;
                        break;
                    case 'diff-staged':
                        isAvailable = state.files.staging.length > 0;
                        break;
                    case 'stash':
                        isAvailable = state.files.working.length > 0 || state.files.staging.length > 0;
                        break;
                    case 'stash-pop':
                        isAvailable = state.stash.length > 0;
                        break;
                    case 'stash-clear':
                        isAvailable = state.stash.length > 0;
                        break;
                    case 'merge':
                    case 'merge-no-ff':
                        isAvailable = state.branches.length > 1;
                        break;
                    case 'branch-delete':
                        isAvailable = state.branches.length > 1;
                        break;
                }
            }

            if (isAvailable) {
                btn.classList.add('available');
                if (cmd === suggested) {
                    btn.classList.add('suggested');
                }
            } else {
                btn.classList.add('error');
            }
        });

        // Update flow arrows
        const arrowAdd = document.getElementById('arrow-add');
        const arrowCommit = document.getElementById('arrow-commit');
        const arrowPush = document.getElementById('arrow-push');
        if (arrowAdd) arrowAdd.classList.toggle('active', suggested === 'add-all');
        if (arrowCommit) arrowCommit.classList.toggle('active', suggested === 'commit');
        if (arrowPush) arrowPush.classList.toggle('active', suggested === 'push');
    }

    renderZone(zoneName) {
        const container = this.zones[zoneName];
        container.innerHTML = ''; // Clear

        const items = this.state.files[zoneName];

        if (items.length === 0) {
            if (zoneName === 'staging') {
                container.innerHTML = '<div class="empty-state">No files staged</div>';
            } else if (zoneName === 'local' || zoneName === 'remote') {
                // container.innerHTML = '<div class="empty-state">No commits yet</div>';
            } else if (zoneName === 'working' && this.state.initialized) {
                container.innerHTML = '<div class="empty-state">Working tree clean</div>';
            }
            return;
        }

        // Render Logic based on Zone Type
        if (zoneName === 'working' || zoneName === 'staging') {
            items.forEach(file => {
                const el = document.createElement('div');
                el.className = 'file-item';
                el.innerHTML = `
                    <i class="ph ${file.icon || 'ph-file'}"></i>
                    <span>${file.name}</span>
                    <span class="status ${file.status}">${file.status === 'untracked' ? 'U' : 'M'}</span>
                `;
                container.appendChild(el);
            });
        } else {
            // Render Commits (Local/Remote)
            // Show latest first
            [...items].reverse().forEach(commit => {
                const el = document.createElement('div');
                el.className = 'commit-item';
                // Adjust style for commit item in JS or CSS? CSS exists.
                el.style.marginBottom = '8px';
                el.innerHTML = `
                    <div class="commit-hash" style="display:flex; justify-content:space-between;">
                        <span>${commit.id}</span>
                    </div>
                    <div class="commit-msg">${commit.message}</div>
                `;
                container.appendChild(el);
            });
        }
    }

    // --- Animation System ---

    async animatePackage(fromZoneId, toZoneId, emoji) {
        return new Promise(resolve => {
            const fromEl = document.getElementById(fromZoneId);
            const toEl = document.getElementById(toZoneId);

            if (!fromEl || !toEl) {
                resolve();
                return;
            }

            const fromRect = fromEl.getBoundingClientRect();
            const toRect = toEl.getBoundingClientRect();

            // Create floating element
            const floater = document.createElement('div');
            floater.className = 'floating-package';
            floater.textContent = emoji;
            floater.style.width = '64px';
            floater.style.height = '64px';

            // Start Position (Center of Source)
            // Account for scroll if using fixed; check parents.
            // Using viewport coords is safest for fixed elements
            const startX = fromRect.left + fromRect.width / 2 - 32;
            const startY = fromRect.top + fromRect.height / 2 - 32;

            floater.style.left = `${startX}px`;
            floater.style.top = `${startY}px`;

            document.body.appendChild(floater);

            // Animate using Web Animations API
            const deltaX = (toRect.left + toRect.width / 2) - (fromRect.left + fromRect.width / 2);
            const deltaY = (toRect.top + toRect.height / 2) - (fromRect.top + fromRect.height / 2);

            const animation = floater.animate([
                { transform: 'scale(0) rotate(0deg)', offset: 0 },
                { transform: 'scale(1) rotate(0deg)', offset: 0.1 }, // Spawn
                { transform: `translate(${deltaX / 2}px, ${deltaY / 2}px) scale(1.2) rotate(180deg)`, offset: 0.5 }, // Midpoint
                { transform: `translate(${deltaX}px, ${deltaY}px) scale(1) rotate(360deg)`, offset: 0.9 }, // Arrive
                { transform: `translate(${deltaX}px, ${deltaY}px) scale(0) rotate(360deg)`, offset: 1 } // Despawn
            ], {
                duration: 800,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                fill: 'forwards'
            });

            animation.onfinish = () => {
                floater.remove();
                resolve();
            };
        });
    }

    // --- Notification System ---

    showInfo(title, text) {
        this.infoBox.title.textContent = title;
        this.infoBox.text.textContent = text;
        this.infoBox.text.innerHTML = text.replace(/\n/g, '<br>');

        this.infoBox.el.classList.remove('hidden');

        // Auto hide - duration based on content length (min 4s, max 15s)
        const wordCount = text.split(/\s+/).length;
        const duration = Math.min(Math.max(wordCount * 300, 4000), 15000);
        if (this.infoTimeout) clearTimeout(this.infoTimeout);
        this.infoTimeout = setTimeout(() => {
            this.hideInfo();
        }, duration);
    }

    hideInfo() {
        this.infoBox.el.classList.add('hidden');
    }
    showCommandPalette() {
        const overlay = document.createElement('div');
        overlay.className = 'cmd-palette';

        const input = document.createElement('input');
        input.className = 'cmd-input';
        input.placeholder = '> Type a command...';
        input.autofocus = true;

        const list = document.createElement('div');
        list.className = 'cmd-list';

        const commands = [
            { cmd: 'branch-create', desc: 'Create new branch' },
            { cmd: 'checkout', desc: 'Switch branch' },
            { cmd: 'fork', desc: 'Fork repository' },
            { cmd: 'pr', desc: 'Create Pull Request' },
            { cmd: 'stash', desc: 'Stash changes' },
            { cmd: 'log-graph', desc: 'View commit graph' },
            { cmd: 'commit', desc: 'Commit changes' },
            { cmd: 'push', desc: 'Push to remote' }
        ];

        const render = (filter = '') => {
            list.innerHTML = '';
            commands.filter(c => c.cmd.includes(filter) || c.desc.toLowerCase().includes(filter.toLowerCase())).forEach((c, i) => {
                const el = document.createElement('div');
                el.className = `cmd-option ${i === 0 ? 'selected' : ''}`;
                el.innerHTML = `<span>${c.cmd}</span> <span style="color:#666">${c.desc}</span>`;
                el.onclick = () => {
                    this.executeCommand(c.cmd);
                    overlay.remove();
                };
                list.appendChild(el);
            });
        };

        input.oninput = (e) => render(e.target.value);
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                const selected = list.querySelector('.selected span');
                if (selected) {
                    this.executeCommand(selected.innerText);
                    overlay.remove();
                }
            } else if (e.key === 'Escape') {
                overlay.remove();
            }
        };

        overlay.appendChild(input);
        overlay.appendChild(list);
        document.body.appendChild(overlay);
        input.focus();
        render();

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', function close(e) {
                if (!overlay.contains(e.target)) {
                    overlay.remove();
                    document.removeEventListener('click', close);
                }
            });
        }, 100);
    }

    // =============================================
    // SCENARIO / GUIDED LEARNING SYSTEM
    // =============================================

    initScenarios() {
        this.scenarios = [
            {
                id: 'first-commit',
                title: 'Your First Commit',
                desc: 'Learn the basic Git workflow: init, add, commit',
                steps: [
                    { cmd: 'init', instruction: 'Start by initializing a Git repository.' },
                    { cmd: 'add-all', instruction: 'Stage all files for your first commit.' },
                    { cmd: 'commit', instruction: 'Create your first commit with a message.' }
                ]
            },
            {
                id: 'push-to-remote',
                title: 'Push to Remote',
                desc: 'Complete workflow: init, add, commit, push to GitHub',
                steps: [
                    { cmd: 'init', instruction: 'Initialize a new repository.' },
                    { cmd: 'add-all', instruction: 'Stage your files.' },
                    { cmd: 'commit', instruction: 'Commit your changes.' },
                    { cmd: 'remote-add', instruction: 'Connect to a remote server (GitHub).' },
                    { cmd: 'push', instruction: 'Push your commits to the remote repository.' }
                ]
            },
            {
                id: 'branch-merge',
                title: 'Branch & Merge',
                desc: 'Create a feature branch, work on it, and merge back',
                steps: [
                    { cmd: 'init', instruction: 'Initialize the repository.' },
                    { cmd: 'add-all', instruction: 'Stage files.' },
                    { cmd: 'commit', instruction: 'Make an initial commit on main.' },
                    { cmd: 'branch-create', instruction: 'Create a new feature branch.' },
                    { cmd: 'checkout', instruction: 'Switch to your new branch.' },
                    { cmd: 'checkout', instruction: 'Switch back to main to merge.' },
                    { cmd: 'merge', instruction: 'Merge the feature branch into main.' }
                ]
            },
            {
                id: 'undo-mistakes',
                title: 'Undoing Mistakes',
                desc: 'Learn how to undo changes at every stage',
                steps: [
                    { cmd: 'init', instruction: 'Initialize the repository.' },
                    { cmd: 'add-all', instruction: 'Stage all files.' },
                    { cmd: 'restore-staged', instruction: 'Unstage files — move them back to working directory.' },
                    { cmd: 'add-all', instruction: 'Stage them again.' },
                    { cmd: 'commit', instruction: 'Commit the changes.' },
                    { cmd: 'reset', instruction: 'Undo the commit but keep changes in working directory.' }
                ]
            },
            {
                id: 'stash-workflow',
                title: 'Stashing Changes',
                desc: 'Save work temporarily and restore it later',
                steps: [
                    { cmd: 'init', instruction: 'Initialize the repository.' },
                    { cmd: 'stash', instruction: 'Stash your current changes to save them temporarily.' },
                    { cmd: 'stash-list', instruction: 'Check your stash list.' },
                    { cmd: 'stash-pop', instruction: 'Restore your stashed changes.' }
                ]
            }
        ];

        this.activeScenario = null;
        this.currentStepIndex = 0;

        // Render scenario list
        this.renderScenarioList();

        // Event listeners for scenario UI
        const toggleBtn = document.getElementById('scenarioToggle');
        const closeBtn = document.getElementById('scenarioClose');
        const quitBtn = document.getElementById('stepQuit');
        const panel = document.getElementById('scenarioPanel');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                panel.classList.toggle('hidden');
            });
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                panel.classList.add('hidden');
            });
        }
        if (quitBtn) {
            quitBtn.addEventListener('click', () => {
                this.quitScenario();
            });
        }
    }

    renderScenarioList() {
        const list = document.getElementById('scenarioList');
        if (!list) return;
        list.innerHTML = '';

        this.scenarios.forEach(scenario => {
            const el = document.createElement('div');
            el.className = 'scenario-item';
            el.innerHTML = `
                <div class="scenario-item-title">${scenario.title}</div>
                <div class="scenario-item-desc">${scenario.desc}</div>
                <div class="scenario-item-steps">${scenario.steps.length} steps</div>
            `;
            el.addEventListener('click', () => {
                this.startScenario(scenario);
            });
            list.appendChild(el);
        });
    }

    startScenario(scenario) {
        // Reset state first
        this.reset();
        this.activeScenario = scenario;
        this.currentStepIndex = 0;

        // Hide scenario panel, show step bar
        document.getElementById('scenarioPanel').classList.add('hidden');
        document.getElementById('scenarioStepBar').classList.remove('hidden');

        this.renderCurrentStep();
        this.updateCommandStates();
        this.showInfo('Scenario Started', `"${scenario.title}"\n\nFollow the highlighted commands step by step.`);
    }

    renderCurrentStep() {
        if (!this.activeScenario) return;

        const step = this.activeScenario.steps[this.currentStepIndex];
        const titleEl = document.getElementById('stepTitle');
        const progressEl = document.getElementById('stepProgress');
        const instructionEl = document.getElementById('stepInstruction');

        titleEl.textContent = this.activeScenario.title;
        progressEl.textContent = `Step ${this.currentStepIndex + 1} / ${this.activeScenario.steps.length}`;
        instructionEl.textContent = step.instruction;

        // Highlight the expected command and scroll to it
        document.querySelectorAll('.cmd-btn').forEach(btn => {
            btn.classList.remove('suggested');
            if (btn.dataset.cmd === step.cmd) {
                btn.classList.add('suggested');
                btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }

    advanceScenario(executedCmd) {
        if (!this.activeScenario) return;

        const step = this.activeScenario.steps[this.currentStepIndex];
        if (executedCmd !== step.cmd) return;

        this.currentStepIndex++;

        if (this.currentStepIndex >= this.activeScenario.steps.length) {
            this.completeScenario();
            return;
        }

        this.renderCurrentStep();
    }

    completeScenario() {
        const anim = window.animEngine;
        if (anim) {
            anim.confetti(window.innerWidth / 2, window.innerHeight / 2, 40);
        }

        this.showInfo('Scenario Complete!',
            `You completed "${this.activeScenario.title}"!\n\nYou now understand this Git workflow. Try another scenario or explore commands freely.`
        );

        this.activeScenario = null;
        this.currentStepIndex = 0;
        document.getElementById('scenarioStepBar').classList.add('hidden');
        this.updateCommandStates();
    }

    quitScenario() {
        this.activeScenario = null;
        this.currentStepIndex = 0;
        document.getElementById('scenarioStepBar').classList.add('hidden');
        document.querySelectorAll('.cmd-btn').forEach(btn => btn.classList.remove('suggested'));
        this.updateCommandStates();
        this.showInfo('Scenario Quit', 'Scenario cancelled. You can explore commands freely.');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.gitVis = new GitVisualizer();
});
