/**
 * Conference Deadline Calendar
 * Security | Artificial Intelligence | NLP — Typical submission-deadline months
 * Data source: ccf.atom.im / portal.core.edu.au / ccf-deadlines
 */

(function () {
  'use strict';

  const CONFERENCES = [
    // January (11)
    { month: 1, monthName: "January", abbr: "ICML", name: "International Conference on Machine Learning", track: "AI", ccf: "CCF A", core: "CORE A*", rate: 27.0, rateStr: "27.0%" },
    { month: 1, monthName: "January", abbr: "IJCAI", name: "International Joint Conference on Artificial Intelligence", track: "AI", ccf: "CCF B", core: "CORE A*", rate: 15.3, rateStr: "15.3%" },
    { month: 1, monthName: "January", abbr: "ACL", name: "Annual Meeting of the Association for Computational Linguistics", track: "NLP", ccf: "CCF A", core: "CORE A*", rate: 19.8, rateStr: "19.8%" },
    { month: 1, monthName: "January", abbr: "USENIX Security", name: "USENIX Security Symposium", track: "Security", ccf: "CCF A", core: "CORE A*", rate: 15.4, rateStr: "15.4%" },
    { month: 1, monthName: "January", abbr: "GECCO", name: "Genetic and Evolutionary Computation Conference", track: "AI", ccf: "CCF C", core: "CORE A", rate: 35.9, rateStr: "35.9%" },
    { month: 1, monthName: "January", abbr: "CSFW", name: "IEEE Computer Security Foundations Workshop", track: "Security", ccf: "CCF B", core: "CORE A", rate: 20.6, rateStr: "20.6%" },
    { month: 1, monthName: "January", abbr: "FG", name: "IEEE International Conference on Automatic Face and Gesture Recognition", track: "AI", ccf: "CCF C", core: "CORE B", rate: 60.0, rateStr: "60.0%" },
    { month: 1, monthName: "January", abbr: "ICPR", name: "International Conference on Pattern Recognition", track: "AI", ccf: "CCF C", core: "CORE B", rate: 45.1, rateStr: "45.1%" },
    { month: 1, monthName: "January", abbr: "IEEE CEC", name: "Congress on Evolutionary Computation", track: "AI", ccf: "CCF C", core: "CORE B", rate: 53.6, rateStr: "53.6%" },
    { month: 1, monthName: "January", abbr: "IJCNN", name: "International Joint Conference on Neural Networks", track: "AI", ccf: "CCF C", core: "CORE B", rate: 46.3, rateStr: "46.3%" },
    { month: 1, monthName: "January", abbr: "ACNS", name: "International Conference on Applied Cryptography and Network Security", track: "Security", ccf: "CCF C", core: "CORE B", rate: 22.3, rateStr: "22.3%" },

    // February (10)
    { month: 2, monthName: "February", abbr: "COLT", name: "Annual Conference on Computational Learning Theory", track: "AI", ccf: "CCF B", core: "CORE A*", rate: 32.6, rateStr: "32.6%" },
    { month: 2, monthName: "February", abbr: "CRYPTO", name: "International Cryptology Conference", track: "Security", ccf: "CCF A", core: "CORE A*", rate: 25.2, rateStr: "25.2%" },
    { month: 2, monthName: "February", abbr: "ICDAR", name: "International Conference on Document Analysis and Recognition", track: "AI", ccf: "CCF C", core: "CORE A", rate: 48.9, rateStr: "48.9%" },
    { month: 2, monthName: "February", abbr: "UAI", name: "Conference on Uncertainty in Artificial Intelligence", track: "AI", ccf: "CCF B", core: "CORE A", rate: 28.2, rateStr: "28.2%" },
    { month: 2, monthName: "February", abbr: "PETS", name: "Privacy Enhancing Technologies Symposium", track: "Security", ccf: "CCF C", core: "CORE A", rate: 23.1, rateStr: "23.1%" },
    { month: 2, monthName: "February", abbr: "SOUPS", name: "Symposium On Usable Privacy and Security", track: "Security", ccf: "CCF C", core: "CORE A", rate: 20.9, rateStr: "20.9%" },
    { month: 2, monthName: "February", abbr: "CoNLL", name: "Conference on Computational Natural Language Learning", track: "NLP", ccf: "CCF C", core: "CORE B", rate: 22.2, rateStr: "22.2%" },
    { month: 2, monthName: "February", abbr: "DIMVA", name: "Conference on Detection of Intrusions and Malware & Vulnerability Assessment", track: "Security", ccf: "CCF C", core: "CORE B", rate: 26.5, rateStr: "26.5%" },
    { month: 2, monthName: "February", abbr: "KSEM", name: "International conference on Knowledge Science, Engineering and Management", track: "AI", ccf: "CCF C", core: "CORE C", rate: 40.0, rateStr: "40.0%" },
    { month: 2, monthName: "February", abbr: "IH&MMSec", name: "ACM Workshop on Information Hiding and Multimedia Security", track: "Security", ccf: "CCF C", core: "CORE C", rate: 48.7, rateStr: "48.7%" },

    // March (8)
    { month: 3, monthName: "March", abbr: "ECCV", name: "European Conference on Computer Vision", track: "AI", ccf: "CCF B", core: "CORE A*", rate: 27.6, rateStr: "27.6%" },
    { month: 3, monthName: "March", abbr: "ICCV", name: "International Conference on Computer Vision", track: "AI", ccf: "CCF A", core: "CORE A*", rate: 25.2, rateStr: "25.2%" },
    { month: 3, monthName: "March", abbr: "IROS", name: "IEEE/RSJ International Conference on Intelligent Robots and Systems", track: "AI", ccf: "CCF C", core: "CORE A", rate: 41.8, rateStr: "41.8%" },
    { month: 3, monthName: "March", abbr: "ACISP", name: "Australasia Conference on Information Security and Privacy", track: "Security", ccf: "CCF C", core: "CORE B", rate: 29.6, rateStr: "29.6%" },
    { month: 3, monthName: "March", abbr: "WiSec", name: "ACM Conference on Security and Privacy in Wireless and Mobile Networks", track: "Security", ccf: "CCF C", core: "CORE B", rate: 20.6, rateStr: "20.6%" },
    { month: 3, monthName: "March", abbr: "ICANN", name: "International Conference on Artificial Neural Networks", track: "AI", ccf: "CCF C", core: "CORE C", rate: 45.2, rateStr: "45.2%" },
    { month: 3, monthName: "March", abbr: "ICCBR", name: "International Conference on Case-Based Reasoning", track: "AI", ccf: "CCF B", core: "CORE C", rate: 37.0, rateStr: "37.0%" },
    { month: 3, monthName: "March", abbr: "SACMAT", name: "ACM Symposium on Access Control Models and Technologies", track: "Security", ccf: "CCF C", core: "CORE C", rate: 31.3, rateStr: "31.3%" },

    // April (10)
    { month: 4, monthName: "April", abbr: "CCS", name: "ACM Conference on Computer and Communications Security", track: "Security", ccf: "CCF A", core: "CORE A*", rate: 20.5, rateStr: "20.5%" },
    { month: 4, monthName: "April", abbr: "ECAI", name: "European Conference on Artificial Intelligence", track: "AI", ccf: "CCF B", core: "CORE A", rate: 19.0, rateStr: "19.0%" },
    { month: 4, monthName: "April", abbr: "PPSN", name: "Parallel Problem Solving from Nature", track: "AI", ccf: "CCF B", core: "CORE A", rate: 34.9, rateStr: "34.9%" },
    { month: 4, monthName: "April", abbr: "CHES", name: "International Conference on Cryptographic Hardware and Embedded Systems", track: "Security", ccf: "CCF B", core: "CORE A", rate: 28.7, rateStr: "28.7%" },
    { month: 4, monthName: "April", abbr: "ESORICS", name: "European Symposium on Research in Computer Security", track: "Security", ccf: "CCF B", core: "CORE A", rate: 15.7, rateStr: "15.7%" },
    { month: 4, monthName: "April", abbr: "RAID", name: "International Symposium on Recent Advances in Intrusion Detection", track: "Security", ccf: "CCF B", core: "CORE A", rate: 21.6, rateStr: "21.6%" },
    { month: 4, monthName: "April", abbr: "IJCB", name: "International Joint Conference on Biometrics", track: "AI", ccf: "CCF C", core: "CORE B", rate: 36.2, rateStr: "36.2%" },
    { month: 4, monthName: "April", abbr: "NSPW", name: "New Security Paradigms Workshop", track: "Security", ccf: "CCF C", core: "CORE C", rate: 33.3, rateStr: "33.3%" },
    { month: 4, monthName: "April", abbr: "SecureComm", name: "International Conference on Security and Privacy in Communication Networks", track: "Security", ccf: "CCF C", core: "CORE C", rate: 34.6, rateStr: "34.6%" },
    { month: 4, monthName: "April", abbr: "BlockSys", name: "International Conference on Blockchain, Artificial Intelligence, and Trustworthy Systems", track: "Security", ccf: "CCF C", core: "Not in CORE", rate: 47.1, rateStr: "47.1%" },

    // May (12)
    { month: 5, monthName: "May", abbr: "KR", name: "International Conference on Principles of Knowledge Representation and Reasoning", track: "AI", ccf: "CCF B", core: "CORE A*", rate: 26.8, rateStr: "26.8%" },
    { month: 5, monthName: "May", abbr: "NeurIPS", name: "Conference on Neural Information Processing Systems", track: "AI", ccf: "CCF A", core: "CORE A*", rate: 25.3, rateStr: "25.3%" },
    { month: 5, monthName: "May", abbr: "EMNLP", name: "Conference on Empirical Methods in Natural Language Processing", track: "NLP", ccf: "CCF B", core: "CORE A*", rate: 21.5, rateStr: "21.5%" },
    { month: 5, monthName: "May", abbr: "BMVC", name: "British Machine Vision Conference", track: "AI", ccf: "CCF C", core: "CORE A", rate: 28.3, rateStr: "28.3%" },
    { month: 5, monthName: "May", abbr: "ACSAC", name: "Annual Computer Security Applications Conference", track: "Security", ccf: "CCF B", core: "CORE A", rate: 21.1, rateStr: "21.1%" },
    { month: 5, monthName: "May", abbr: "ASIACRYPT", name: "Annual International Conference on the Theory and Application of Cryptology and Information Security", track: "Security", ccf: "CCF B", core: "CORE A", rate: 28.0, rateStr: "28.0%" },
    { month: 5, monthName: "May", abbr: "ICONIP", name: "International Conference on Neural Information Processing", track: "AI", ccf: "CCF C", core: "CORE B", rate: 50.9, rateStr: "50.9%" },
    { month: 5, monthName: "May", abbr: "SAC", name: "Selected Areas in Cryptography", track: "Security", ccf: "CCF C", core: "CORE B", rate: 26.7, rateStr: "26.7%" },
    { month: 5, monthName: "May", abbr: "SRDS", name: "IEEE International Symposium on Reliable Distributed Systems", track: "Security", ccf: "CCF B", core: "CORE B", rate: 32.1, rateStr: "32.1%" },
    { month: 5, monthName: "May", abbr: "TCC", name: "Theory of Cryptography Conference", track: "Security", ccf: "CCF B", core: "CORE B", rate: 35.4, rateStr: "35.4%" },
    { month: 5, monthName: "May", abbr: "ICICS", name: "International Conference on Information and Communications Security", track: "Security", ccf: "CCF C", core: "CORE C", rate: 24.2, rateStr: "24.2%" },
    { month: 5, monthName: "May", abbr: "Inscrypt", name: "International Conference on Information Security and Cryptology", track: "Security", ccf: "CCF C", core: "CORE China-regional", rate: 27.3, rateStr: "27.3%" },

    // June (3)
    { month: 6, monthName: "June", abbr: "PRICAI", name: "Pacific Rim International Conference on Artificial Intelligence", track: "AI", ccf: "CCF C", core: "CORE B", rate: 36.3, rateStr: "36.3%" },
    { month: 6, monthName: "June", abbr: "ISC", name: "Information Security Conference", track: "Security", ccf: "CCF C", core: "CORE C", rate: 30.5, rateStr: "30.5%" },
    { month: 6, monthName: "June", abbr: "NLPCC", name: "CCF International Conference on Natural Language Processing and Chinese Computing", track: "NLP", ccf: "CCF C", core: "Not in CORE", rate: 31.8, rateStr: "31.8%" },

    // July (3)
    { month: 7, monthName: "July", abbr: "ACCV", name: "Asian Conference on Computer Vision", track: "AI", ccf: "CCF C", core: "CORE B", rate: 32.6, rateStr: "32.6%" },
    { month: 7, monthName: "July", abbr: "ICTAI", name: "IEEE International Conference on Tools with Artificial Intelligence", track: "AI", ccf: "CCF C", core: "CORE B", rate: 37.7, rateStr: "37.7%" },
    { month: 7, monthName: "July", abbr: "ACML", name: "Asian Conference on Machine Learning", track: "AI", ccf: "CCF C", core: "CORE C", rate: 29.1, rateStr: "29.1%" },

    // August (4)
    { month: 8, monthName: "August", abbr: "AAAI", name: "AAAI Conference on Artificial Intelligence", track: "AI", ccf: "CCF A", core: "CORE A*", rate: 20.5, rateStr: "20.5%" },
    { month: 8, monthName: "August", abbr: "NDSS", name: "Network and Distributed System Security Symposium", track: "Security", ccf: "CCF A", core: "CORE A*", rate: 18.2, rateStr: "18.2%" },
    { month: 8, monthName: "August", abbr: "TrustCom", name: "IEEE International Conference on Trust, Security and Privacy in Computing and Communications", track: "Security", ccf: "CCF C", core: "CORE B", rate: 28.0, rateStr: "28%" },
    { month: 8, monthName: "August", abbr: "DAI", name: "International Conference on Distributed Artificial Intelligence", track: "AI", ccf: "CCF C", core: "Not in CORE", rate: 48.4, rateStr: "48.4%" },

    // September (5)
    { month: 9, monthName: "September", abbr: "ICLR", name: "International Conference on Learning Representations", track: "AI", ccf: "CCF A", core: "CORE A*", rate: 29.5, rateStr: "29.5%" },
    { month: 9, monthName: "September", abbr: "ICRA", name: "IEEE International Conference on Robotics and Automation", track: "AI", ccf: "CCF B", core: "CORE A*", rate: 41.6, rateStr: "41.6%" },
    { month: 9, monthName: "September", abbr: "FC", name: "Financial Cryptography and Data Security", track: "Security", ccf: "CCF C", core: "CORE A", rate: 18.0, rateStr: "18.0%" },
    { month: 9, monthName: "September", abbr: "CSCloud", name: "International Conference on Cyber Security and Cloud Computing", track: "Security", ccf: "CCF C", core: "Not in CORE", rate: 22.0, rateStr: "22%" },
    { month: 9, monthName: "September", abbr: "SaTML", name: "IEEE Conference on Secure and Trustworthy Machine Learning", track: "Security", ccf: "CCF —", core: "Not in CORE", rate: 24.9, rateStr: "24.9%", badge: "NEW" },

    // October (12)
    { month: 10, monthName: "October", abbr: "EUROCRYPT", name: "International Conference on the Theory and Applications of Cryptographic Techniques", track: "Security", ccf: "CCF A", core: "CORE A*", rate: 20.8, rateStr: "20.8%" },
    { month: 10, monthName: "October", abbr: "AAMAS", name: "International Joint Conference on Autonomous Agents and Multi-agent Systems", track: "AI", ccf: "CCF B", core: "CORE A", rate: 25.3, rateStr: "25.3%" },
    { month: 10, monthName: "October", abbr: "AISTATS", name: "International Conference on Artificial Intelligence and Statistics", track: "AI", ccf: "CCF C", core: "CORE A", rate: 28.4, rateStr: "28.4%" },
    { month: 10, monthName: "October", abbr: "NAACL", name: "North American Chapter of the Association for Computational Linguistics", track: "NLP", ccf: "CCF B", core: "CORE A", rate: 24.6, rateStr: "24.6%" },
    { month: 10, monthName: "October", abbr: "ALT", name: "International Conference on Algorithmic Learning Theory", track: "AI", ccf: "CCF C", core: "CORE B", rate: 35.7, rateStr: "35.7%" },
    { month: 10, monthName: "October", abbr: "COLING", name: "International Conference on Computational Linguistics", track: "NLP", ccf: "CCF B", core: "CORE B", rate: 34.9, rateStr: "34.9%" },
    { month: 10, monthName: "October", abbr: "CT-RSA", name: "The Cryptographer's Track at RSA Conference", track: "Security", ccf: "CCF C", core: "CORE B", rate: 34.3, rateStr: "34.3%" },
    { month: 10, monthName: "October", abbr: "PAM", name: "Passive and Active Measurement Conference", track: "Security", ccf: "CCF C", core: "CORE B", rate: 34.6, rateStr: "34.6%" },
    { month: 10, monthName: "October", abbr: "PKC", name: "International Workshop on Practice and Theory in Public Key Cryptography", track: "Security", ccf: "CCF B", core: "CORE B", rate: 28.2, rateStr: "28.2%" },
    { month: 10, monthName: "October", abbr: "DFRWS", name: "Digital Forensic Research Workshop", track: "Security", ccf: "CCF C", core: "Not in CORE", rate: 23.0, rateStr: "23%" },
    { month: 10, monthName: "October", abbr: "HotSec", name: "USENIX Workshop on Hot Topics in Security", track: "Security", ccf: "CCF C", core: "Not in CORE", rate: null, rateStr: "—" },
    { month: 10, monthName: "October", abbr: "IFIP WG 11.9", name: "IFIP Working Group 11.9 International Conference on Digital Forensics", track: "Security", ccf: "CCF C", core: "Not in CORE", rate: 34.4, rateStr: "34.4%" },

    // November (4)
    { month: 11, monthName: "November", abbr: "CVPR", name: "IEEE/CVF Computer Vision and Pattern Recognition Conference", track: "AI", ccf: "CCF A", core: "CORE A*", rate: 23.8, rateStr: "23.8%" },
    { month: 11, monthName: "November", abbr: "S&P", name: "IEEE Symposium on Security and Privacy", track: "Security", ccf: "CCF A", core: "CORE A*", rate: 13.8, rateStr: "13.8%" },
    { month: 11, monthName: "November", abbr: "FSE", name: "Fast Software Encryption", track: "Security", ccf: "CCF B", core: "CORE B", rate: 26.3, rateStr: "26.3%" },
    { month: 11, monthName: "November", abbr: "CODASPY", name: "Conference on Data and Application Security and Privacy", track: "Security", ccf: "CCF C", core: "Not in CORE", rate: 22.0, rateStr: "22%" },

    // December (6)
    { month: 12, monthName: "December", abbr: "ICAPS", name: "International Conference on Automated Planning and Scheduling", track: "AI", ccf: "CCF B", core: "CORE A*", rate: 23.2, rateStr: "23.2%" },
    { month: 12, monthName: "December", abbr: "AsiaCCS", name: "ACM Asia Conference on Computer and Communications Security", track: "Security", ccf: "CCF C", core: "CORE A", rate: 18.3, rateStr: "18.3%" },
    { month: 12, monthName: "December", abbr: "DSN", name: "International Conference on Dependable Systems and Networks", track: "Security", ccf: "CCF B", core: "CORE A", rate: 20.1, rateStr: "20.1%" },
    { month: 12, monthName: "December", abbr: "EuroS&P", name: "IEEE European Symposium on Security and Privacy", track: "Security", ccf: "CCF C", core: "CORE A", rate: 19.3, rateStr: "19.3%" },
    { month: 12, monthName: "December", abbr: "SEC", name: "IFIP International Information Security Conference", track: "Security", ccf: "CCF C", core: "CORE B", rate: 25.4, rateStr: "25.4%" },
    { month: 12, monthName: "December", abbr: "ICDF2C", name: "International Conference on Digital Forensics & Cyber Crime", track: "Security", ccf: "CCF C", core: "Not in CORE", rate: 33.4, rateStr: "33.4%" }
  ];

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const CORE_ORDER = [
    "CORE A*",
    "CORE A",
    "CORE B",
    "CORE C",
    "CORE China-regional",
    "Not in CORE"
  ];

  // State
  let state = {
    search: '',
    track: 'all',
    core: 'all',
    ccf: 'all',
    view: 'month', // 'month' or 'table'
    sortField: 'month',
    sortAsc: true
  };

  function getTrackIcon(track) {
    if (track === 'Security') return '<i class="fa-solid fa-shield-halved" aria-hidden="true"></i>';
    if (track === 'AI') return '<i class="fa-solid fa-brain" aria-hidden="true"></i>';
    if (track === 'NLP') return '<i class="fa-solid fa-comment-dots" aria-hidden="true"></i>';
    return '';
  }

  function getTrackClass(track) {
    if (track === 'Security') return 'is-security';
    if (track === 'AI') return 'is-ai';
    if (track === 'NLP') return 'is-nlp';
    return '';
  }

  function getCcfClass(ccf) {
    if (ccf === 'CCF A') return 'ccf-a';
    if (ccf === 'CCF B') return 'ccf-b';
    if (ccf === 'CCF C') return 'ccf-c';
    return 'ccf-none';
  }

  function highlightText(text, query) {
    if (!query) return escapeHtml(text);
    const escapedText = escapeHtml(text);
    const escapedQuery = escapeRegex(query);
    const reg = new RegExp(`(${escapedQuery})`, 'gi');
    return escapedText.replace(reg, '<mark class="cal-hl">$1</mark>');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Filter function
  function matchesFilter(item) {
    if (state.track !== 'all' && item.track !== state.track) return false;
    if (state.core !== 'all') {
      if (state.core === 'Other') {
        if (item.core === 'CORE A*' || item.core === 'CORE A' || item.core === 'CORE B' || item.core === 'CORE C') {
          return false;
        }
      } else if (item.core !== state.core) {
        return false;
      }
    }
    if (state.ccf !== 'all' && item.ccf !== state.ccf) return false;

    if (state.search.trim()) {
      const q = state.search.trim().toLowerCase();
      const matchAbbr = item.abbr.toLowerCase().includes(q);
      const matchName = item.name.toLowerCase().includes(q);
      const matchTrack = item.track.toLowerCase().includes(q);
      const matchCore = item.core.toLowerCase().includes(q);
      const matchCcf = item.ccf.toLowerCase().includes(q);
      const matchMonth = item.monthName.toLowerCase().includes(q);
      if (!matchAbbr && !matchName && !matchTrack && !matchCore && !matchCcf && !matchMonth) {
        return false;
      }
    }

    return true;
  }

  // Render Month Grid
  function renderMonthGrid(filtered) {
    const gridEl = document.getElementById('cal-months-grid');
    if (!gridEl) return;

    gridEl.innerHTML = '';

    for (let m = 1; m <= 12; m++) {
      const monthName = MONTH_NAMES[m - 1];
      const monthItems = filtered.filter(item => item.month === m);
      const allMonthItems = CONFERENCES.filter(item => item.month === m);

      const card = document.createElement('div');
      card.className = `month-card ${monthItems.length > 0 ? 'has-matches' : 'is-empty-month'}`;
      card.id = `month-${monthName.toLowerCase()}`;

      // Group items by CORE
      let groupsHtml = '';
      CORE_ORDER.forEach(coreTier => {
        const tierItems = monthItems.filter(item => {
          if (coreTier === 'Not in CORE') {
            return item.core === 'Not in CORE';
          }
          return item.core === coreTier;
        });

        if (tierItems.length === 0) return;

        let itemsHtml = tierItems.map(item => `
          <div class="conf-item">
            <div class="conf-info">
              <div class="conf-abbr-wrap">
                <span class="conf-abbr">${highlightText(item.abbr, state.search)}</span>
                ${item.badge ? `<span class="badge-new">${item.badge}</span>` : ''}
              </div>
              <div class="conf-name">${highlightText(item.name, state.search)}</div>
            </div>
            <div class="conf-meta">
              <div class="conf-badges-row">
                <span class="badge-track ${getTrackClass(item.track)}" title="Track: ${item.track}">
                  ${getTrackIcon(item.track)} ${item.track}
                </span>
                <span class="badge-ccf ${getCcfClass(item.ccf)}" title="CCF Class">${item.ccf}</span>
              </div>
              <span class="badge-rate" title="Acceptance Rate">${item.rateStr}</span>
            </div>
          </div>
        `).join('');

        const coreLabel = coreTier;
        groupsHtml += `
          <div class="core-group" data-core="${coreTier}">
            <div class="core-header">
              <span class="core-indicator-dot"></span>
              <span>${coreLabel} (${tierItems.length})</span>
            </div>
            <div class="core-items">${itemsHtml}</div>
          </div>
        `;
      });

      card.innerHTML = `
        <div class="month-header">
          <h3 class="month-name">${monthName}</h3>
          <span class="month-count-badge">${monthItems.length} deadline${monthItems.length === 1 ? '' : 's'}</span>
        </div>
        <div class="month-body">
          ${groupsHtml || '<p style="color:var(--rc-text-subtle);font-size:0.8rem;margin:0.5rem 0;">No matching conferences this month.</p>'}
        </div>
      `;

      gridEl.appendChild(card);
    }
  }

  // Render Table View
  function renderTableView(filtered) {
    const tableBody = document.getElementById('cal-table-body');
    if (!tableBody) return;

    let items = [...filtered];

    // Sorting
    items.sort((a, b) => {
      let valA, valB;
      if (state.sortField === 'month') {
        valA = a.month;
        valB = b.month;
      } else if (state.sortField === 'abbr') {
        valA = a.abbr.toLowerCase();
        valB = b.abbr.toLowerCase();
      } else if (state.sortField === 'track') {
        valA = a.track.toLowerCase();
        valB = b.track.toLowerCase();
      } else if (state.sortField === 'core') {
        valA = a.core.toLowerCase();
        valB = b.core.toLowerCase();
      } else if (state.sortField === 'ccf') {
        valA = a.ccf.toLowerCase();
        valB = b.ccf.toLowerCase();
      } else if (state.sortField === 'rate') {
        valA = a.rate !== null ? a.rate : -1;
        valB = b.rate !== null ? b.rate : -1;
      } else {
        valA = a.month;
        valB = b.month;
      }

      if (valA < valB) return state.sortAsc ? -1 : 1;
      if (valA > valB) return state.sortAsc ? 1 : -1;
      return 0;
    });

    tableBody.innerHTML = items.map(item => `
      <tr>
        <td style="font-weight:600;white-space:nowrap;">${item.monthName}</td>
        <td class="td-abbr">
          ${highlightText(item.abbr, state.search)}
          ${item.badge ? `<span class="badge-new" style="margin-left:4px;">${item.badge}</span>` : ''}
        </td>
        <td class="td-name">${highlightText(item.name, state.search)}</td>
        <td>
          <span class="badge-track ${getTrackClass(item.track)}">
            ${getTrackIcon(item.track)} ${item.track}
          </span>
        </td>
        <td>
          <span style="font-size:0.75rem;font-weight:600;color:var(--rc-text-main);">${item.core}</span>
        </td>
        <td>
          <span class="badge-ccf ${getCcfClass(item.ccf)}">${item.ccf}</span>
        </td>
        <td style="font-family:ui-monospace, monospace;font-weight:600;">${item.rateStr}</td>
      </tr>
    `).join('');
  }

  // Update UI & Counters
  function update() {
    const filtered = CONFERENCES.filter(matchesFilter);

    // Update status line
    const counterEl = document.getElementById('cal-matches-count');
    if (counterEl) {
      counterEl.textContent = `Showing ${filtered.length} of ${CONFERENCES.length} conferences`;
    }

    const noResultsEl = document.getElementById('cal-no-results');
    const monthsGridEl = document.getElementById('cal-months-grid');
    const tableViewEl = document.getElementById('cal-table-view');

    if (filtered.length === 0) {
      if (noResultsEl) noResultsEl.classList.add('is-visible');
      if (monthsGridEl) monthsGridEl.style.display = 'none';
      if (tableViewEl) tableViewEl.classList.remove('is-active');
    } else {
      if (noResultsEl) noResultsEl.classList.remove('is-visible');
      if (state.view === 'month') {
        if (monthsGridEl) monthsGridEl.style.display = 'grid';
        if (tableViewEl) tableViewEl.classList.remove('is-active');
        renderMonthGrid(filtered);
      } else {
        if (monthsGridEl) monthsGridEl.style.display = 'none';
        if (tableViewEl) tableViewEl.classList.add('is-active');
        renderTableView(filtered);
      }
    }
  }

  // Attach event listeners
  function init() {
    const searchInput = document.getElementById('cal-search');
    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        state.search = e.target.value;
        update();
      });
    }

    // Filter Buttons (Track, CORE, CCF)
    document.querySelectorAll('[data-filter-type]').forEach(btn => {
      btn.addEventListener('click', function () {
        const type = this.getAttribute('data-filter-type');
        const val = this.getAttribute('data-filter-val');

        // Deselect siblings in group
        const parent = this.closest('.filter-group');
        if (parent) {
          parent.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('is-active'));
        }
        this.classList.add('is-active');

        if (type === 'track') state.track = val;
        if (type === 'core') state.core = val;
        if (type === 'ccf') state.ccf = val;

        update();
      });
    });

    // View toggles
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const view = this.getAttribute('data-view');
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('is-active'));
        this.classList.add('is-active');
        state.view = view;
        update();
      });
    });

    // Reset button
    const resetBtn = document.getElementById('cal-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        state.search = '';
        state.track = 'all';
        state.core = 'all';
        state.ccf = 'all';

        if (searchInput) searchInput.value = '';

        document.querySelectorAll('[data-filter-type]').forEach(btn => {
          if (btn.getAttribute('data-filter-val') === 'all') {
            btn.classList.add('is-active');
          } else {
            btn.classList.remove('is-active');
          }
        });

        update();
      });
    }

    // Table Header Sorting
    document.querySelectorAll('.cal-table th[data-sort]').forEach(th => {
      th.addEventListener('click', function () {
        const field = this.getAttribute('data-sort');
        if (state.sortField === field) {
          state.sortAsc = !state.sortAsc;
        } else {
          state.sortField = field;
          state.sortAsc = true;
        }

        // update table sort indicators
        document.querySelectorAll('.cal-table th[data-sort]').forEach(h => {
          const baseText = h.textContent.replace(/[ ▲▼]/g, '').trim();
          if (h.getAttribute('data-sort') === state.sortField) {
            h.textContent = `${baseText} ${state.sortAsc ? '▲' : '▼'}`;
          } else {
            h.textContent = baseText;
          }
        });

        update();
      });
    });

    // Quicknav smooth scroll
    document.querySelectorAll('.month-nav-pill').forEach(pill => {
      pill.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Initial render
    update();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
