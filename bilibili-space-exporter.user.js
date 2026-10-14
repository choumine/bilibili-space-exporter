// ==UserScript==
// @name         B站视频批量提取器
// @namespace    https://space.bilibili.com/
// @version      1.2.0
// @description  自动提取B站用户空间全部视频信息（标题、BV号、播放量等），导出为CSV文件
// @author       MiMo
// @match        https://space.bilibili.com/*
// @grant        none
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    var PAGE_SIZE = 30;
    var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

    /* ═══════════════════════════════════════════════
       MD5
       ═══════════════════════════════════════════════ */
    function safe_add(x, y) { var l = (x & 0xffff) + (y & 0xffff); return ((x >> 16) + (y >> 16) + (l >> 16)) << 16 | l & 0xffff; }
    function bit_rol(n, c) { return n << c | n >>> 32 - c; }
    function cmn(q, a, b, x, s, t) { return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b); }
    function ff(a, b, c, d, x, s, t) { return cmn(b & c | ~b & d, a, b, x, s, t); }
    function gg(a, b, c, d, x, s, t) { return cmn(b & d | c & ~d, a, b, x, s, t); }
    function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
    function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | ~d), a, b, x, s, t); }
    function core_md5(x, len) {
        x[len >> 5] |= 128 << len % 32; x[(len + 64 >>> 9 << 4) + 14] = len;
        var a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
        for (var i = 0; i < x.length; i += 16) {
            var oa = a, ob = b, oc = c, od = d;
            a = ff(a, b, c, d, x[i], 7, -680876936); d = ff(d, a, b, c, x[i + 1], 12, -389564586); c = ff(c, d, a, b, x[i + 2], 17, 606105819); b = ff(b, c, d, a, x[i + 3], 22, -1044525330);
            a = ff(a, b, c, d, x[i + 4], 7, -176418897); d = ff(d, a, b, c, x[i + 5], 12, 1200080426); c = ff(c, d, a, b, x[i + 6], 17, -1473231341); b = ff(b, c, d, a, x[i + 7], 22, -45705983);
            a = ff(a, b, c, d, x[i + 8], 7, 1770035416); d = ff(d, a, b, c, x[i + 9], 12, -1958414417); c = ff(c, d, a, b, x[i + 10], 17, -42063); b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
            a = ff(a, b, c, d, x[i + 12], 7, 1804603682); d = ff(d, a, b, c, x[i + 13], 12, -40341101); c = ff(c, d, a, b, x[i + 14], 17, -1502002290); b = ff(b, c, d, a, x[i + 15], 22, 1236535329);
            a = gg(a, b, c, d, x[i + 1], 5, -165796510); d = gg(d, a, b, c, x[i + 6], 9, -1069501632); c = gg(c, d, a, b, x[i + 11], 14, 643717713); b = gg(b, c, d, a, x[i], 20, -373897302);
            a = gg(a, b, c, d, x[i + 5], 5, -701558691); d = gg(d, a, b, c, x[i + 10], 9, 38016083); c = gg(c, d, a, b, x[i + 15], 14, -660478335); b = gg(b, c, d, a, x[i + 4], 20, -405537848);
            a = gg(a, b, c, d, x[i + 9], 5, 568446438); d = gg(d, a, b, c, x[i + 14], 9, -1019803690); c = gg(c, d, a, b, x[i + 3], 14, -187363961); b = gg(b, c, d, a, x[i + 8], 20, 1163531501);
            a = gg(a, b, c, d, x[i + 13], 5, -1444681467); d = gg(d, a, b, c, x[i + 2], 9, -51403784); c = gg(c, d, a, b, x[i + 7], 14, 1735328473); b = gg(b, c, d, a, x[i + 12], 20, -1926607734);
            a = hh(a, b, c, d, x[i + 5], 4, -378558); d = hh(d, a, b, c, x[i + 8], 11, -2022574463); c = hh(c, d, a, b, x[i + 11], 16, 1839030562); b = hh(b, c, d, a, x[i + 14], 23, -35309556);
            a = hh(a, b, c, d, x[i + 1], 4, -1530992060); d = hh(d, a, b, c, x[i + 4], 11, 1272893353); c = hh(c, d, a, b, x[i + 7], 16, -155497632); b = hh(b, c, d, a, x[i + 10], 23, -1094730640);
            a = hh(a, b, c, d, x[i + 13], 4, 681279174); d = hh(d, a, b, c, x[i], 11, -358537222); c = hh(c, d, a, b, x[i + 3], 16, -722521979); b = hh(b, c, d, a, x[i + 6], 23, 76029189);
            a = hh(a, b, c, d, x[i + 9], 4, -640364487); d = hh(d, a, b, c, x[i + 12], 11, -421815835); c = hh(c, d, a, b, x[i + 15], 16, 530742520); b = hh(b, c, d, a, x[i + 2], 23, -995338651);
            a = ii(a, b, c, d, x[i], 6, -198630844); d = ii(d, a, b, c, x[i + 7], 10, 1126891415); c = ii(c, d, a, b, x[i + 14], 15, -1416354905); b = ii(b, c, d, a, x[i + 5], 21, -57434055);
            a = ii(a, b, c, d, x[i + 12], 6, 1700485571); d = ii(d, a, b, c, x[i + 3], 10, -1894986606); c = ii(c, d, a, b, x[i + 10], 15, -1051523); b = ii(b, c, d, a, x[i + 1], 21, -2054922799);
            a = ii(a, b, c, d, x[i + 8], 6, 1873313359); d = ii(d, a, b, c, x[i + 15], 10, -30611744); c = ii(c, d, a, b, x[i + 6], 15, -1560198380); b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
            a = ii(a, b, c, d, x[i + 4], 6, -145523070); d = ii(d, a, b, c, x[i + 11], 10, -1120210379); c = ii(c, d, a, b, x[i + 2], 15, 718787259); b = ii(b, c, d, a, x[i + 9], 21, -343485551);
            a = safe_add(a, oa); b = safe_add(b, ob); c = safe_add(c, oc); d = safe_add(d, od);
        }
        return [a, b, c, d];
    }
    function str2binl(s) { var o = []; for (var i = 0; i < s.length * 8; i += 8) { o[i >> 5] = o[i >> 5] || 0; o[i >> 5] |= (s.charCodeAt(i / 8) & 255) << i % 32; } return o; }
    function binl2hex(b) { var t = '0123456789abcdef', s = ''; for (var i = 0; i < b.length * 4; i++) s += t.charAt(b[i >> 2] >> i % 4 * 8 + 4 & 15) + t.charAt(b[i >> 2] >> i % 4 * 8 & 15); return s; }
    function md5(s) { return binl2hex(core_md5(str2binl(s), s.length * 8)); }

    /* ═══════════════════════════════════════════════
       WBI 签名
       ═══════════════════════════════════════════════ */
    var WBI_TABLE = [46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52];

    async function getWbiKeys() {
        var r = await fetch('https://api.bilibili.com/x/web-interface/nav', { credentials: 'include' });
        var j = await r.json();
        return j.data.wbi_img.img_url.split('/').pop().split('.')[0] +
               j.data.wbi_img.sub_url.split('/').pop().split('.')[0];
    }

    function signWbi(params, rawKey) {
        var mixin = '';
        for (var i = 0; i < WBI_TABLE.length; i++) mixin += rawKey[WBI_TABLE[i]];
        mixin = mixin.slice(0, 32);
        var p = Object.assign({}, params, { wts: Math.round(Date.now() / 1000) });
        var keys = Object.keys(p).sort();
        var parts = [];
        for (var k = 0; k < keys.length; k++) {
            parts.push(keys[k] + '=' + encodeURIComponent(String(p[keys[k]]).replace(/[!'()*]/g, '')));
        }
        var qs = parts.join('&');
        return qs + '&w_rid=' + md5(qs + mixin);
    }

    /* ═══════════════════════════════════════════════
       UID 解析（兼容数字 UID 和 UUID 格式）
       ═══════════════════════════════════════════════ */
    function resolveUid() {
        var m = location.pathname.match(/\/(\d+)(?:\/|$|\?)/);
        if (m) return m[1];

        try {
            var st = window.__INITIAL_STATE__;
            if (st) {
                if (st.mid) return String(st.mid);
                if (st.userInfo && st.userInfo.mid) return String(st.userInfo.mid);
                for (var k in st) {
                    if (st[k] && typeof st[k] === 'object' && st[k].mid && /^\d+$/.test(st[k].mid)) {
                        return String(st[k].mid);
                    }
                }
            }
        } catch (e) { }

        try {
            var scripts = document.querySelectorAll('script:not([src])');
            for (var i = 0; i < scripts.length; i++) {
                var match = scripts[i].textContent.match(/["']mid["']\s*:\s*["']?(\d{4,})["']?/);
                if (match) return match[1];
            }
        } catch (e) { }

        try {
            var links = document.querySelectorAll('a[href*="bilibili.com"]');
            for (var j = 0; j < links.length; j++) {
                var mc = links[j].href.match(/space\.bilibili\.com\/(\d{4,})/);
                if (mc) return mc[1];
            }
        } catch (e) { }

        try {
            var html = document.documentElement.innerHTML;
            var hm = html.match(/["']mid["']\s*:\s*["']?(\d{4,})["']?/);
            if (hm) return hm[1];
        } catch (e) { }

        return null;
    }

    /* ═══════════════════════════════════════════════
       API 请求
       ═══════════════════════════════════════════════ */
    async function fetchPage(uid, pn, rawKey) {
        var qs = signWbi({
            mid: uid, ps: PAGE_SIZE, pn: pn, order: 'pubdate',
            keyword: '', tid: 0, platform: 'web', web_location: '1550101'
        }, rawKey);
        var r = await fetch('https://api.bilibili.com/x/space/wbi/arc/search?' + qs, {
            credentials: 'include',
            headers: { Referer: 'https://space.bilibili.com/' + uid + '/video' }
        });
        var j = await r.json();
        if (j.code === -412) throw new Error('请求频率过高被风控 (-412)，请等待几分钟后重试');
        if (j.code === -352) throw new Error('WBI 签名验证失败 (-352)，请刷新页面后重试');
        if (j.code !== 0) throw new Error('API 错误 ' + j.code + ': ' + (j.message || j.msg || '未知错误'));
        return j.data;
    }

    /* ═══════════════════════════════════════════════
       CSV 安全下载（阻止 SPA 路由劫持）
       ═══════════════════════════════════════════════ */
    function downloadCSV(csvBody, filename) {
        var blob = new Blob(['\uFEFF' + csvBody], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        var stopper = function (e) { e.stopPropagation(); e.stopImmediatePropagation(); };
        a.addEventListener('click', stopper, true);
        document.body.appendChild(a);
        a.click();
        a.removeEventListener('click', stopper, true);
        setTimeout(function () {
            if (a.parentNode) a.parentNode.removeChild(a);
            URL.revokeObjectURL(url);
        }, 3000);
    }

    /* ═══════════════════════════════════════════════
       注入样式
       ═══════════════════════════════════════════════ */
    var style = document.createElement('style');
    style.textContent = [
        '#__bili_extractor_fab {',
        '  position: fixed; right: 24px; bottom: 24px; z-index: 999990;',
        '  width: 52px; height: 52px; border-radius: 50%; border: none;',
        '  background: linear-gradient(135deg, #00a1d6 0%, #0079c1 100%);',
        '  color: #fff; font-size: 22px; cursor: pointer;',
        '  box-shadow: 0 4px 16px rgba(0,161,214,0.4), 0 1px 4px rgba(0,0,0,0.15);',
        '  transition: transform 0.2s ease, box-shadow 0.2s ease;',
        '  display: flex; align-items: center; justify-content: center;',
        '  line-height: 1;',
        '}',
        '#__bili_extractor_fab:hover {',
        '  transform: scale(1.1);',
        '  box-shadow: 0 6px 24px rgba(0,161,214,0.5), 0 2px 8px rgba(0,0,0,0.2);',
        '}',
        '#__bili_extractor_fab:active {',
        '  transform: scale(0.95);',
        '}',
        '',
        '#__bili_extractor_overlay {',
        '  position: fixed; top: 0; left: 0; right: 0; bottom: 0;',
        '  z-index: 999991; background: rgba(0,0,0,0.45);',
        '  display: flex; align-items: center; justify-content: center;',
        '  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;',
        '  animation: __be_fadeIn 0.2s ease;',
        '}',
        '@keyframes __be_fadeIn { from { opacity: 0; } to { opacity: 1; } }',
        '@keyframes __be_slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }',
        '',
        '#__bili_extractor_card {',
        '  background: #fff; border-radius: 16px; padding: 32px 36px;',
        '  box-shadow: 0 12px 48px rgba(0,0,0,0.2);',
        '  min-width: 420px; max-width: 520px;',
        '  animation: __be_slideUp 0.3s ease;',
        '}',
        '',
        '#__bili_extractor_overlay .__be_title {',
        '  margin: 0 0 6px; font-size: 20px; font-weight: 700; color: #18191c;',
        '}',
        '#__bili_extractor_overlay .__be_sub {',
        '  margin: 0 0 4px; font-size: 13px; color: #9499a0;',
        '}',
        '#__bili_extractor_overlay .__be_sub b { color: #00a1d6; font-weight: 600; }',
        '#__bili_extractor_overlay .__be_path {',
        '  margin: 0 0 20px; font-size: 12px; color: #b0b3b8;',
        '  word-break: break-all;',
        '}',
        '',
        '#__bili_extractor_overlay .__be_bar_wrap {',
        '  background: #e3e5e7; border-radius: 6px; height: 8px;',
        '  margin-bottom: 12px; overflow: hidden; display: none;',
        '}',
        '#__bili_extractor_overlay .__be_bar_fill {',
        '  background: linear-gradient(90deg, #00a1d6, #23d5d5);',
        '  height: 100%; width: 0; border-radius: 6px;',
        '  transition: width 0.3s ease;',
        '}',
        '',
        '#__bili_extractor_overlay .__be_status {',
        '  margin: 0 0 20px; font-size: 14px; color: #61666d; min-height: 22px;',
        '}',
        '',
        '#__bili_extractor_overlay .__be_btn {',
        '  width: 100%; padding: 12px; border: none; border-radius: 8px;',
        '  font-size: 15px; font-weight: 600; cursor: pointer;',
        '  transition: background 0.2s ease, opacity 0.2s ease;',
        '}',
        '#__bili_extractor_overlay .__be_btn_primary {',
        '  background: #00a1d6; color: #fff;',
        '}',
        '#__bili_extractor_overlay .__be_btn_primary:hover { background: #0090c0; }',
        '#__bili_extractor_overlay .__be_btn_primary:disabled {',
        '  background: #b0b3b8; cursor: not-allowed; opacity: 0.8;',
        '}',
        '',
        '#__bili_extractor_overlay .__be_btn_ghost {',
        '  width: 100%; padding: 8px; background: transparent;',
        '  color: #b0b3b8; border: none; font-size: 13px; cursor: pointer;',
        '  margin-top: 8px; transition: color 0.2s ease;',
        '}',
        '#__bili_extractor_overlay .__be_btn_ghost:hover { color: #61666d; }',
    ].join('\n');
    document.head.appendChild(style);

    /* ═══════════════════════════════════════════════
       悬浮按钮
       ═══════════════════════════════════════════════ */
    var fab = document.createElement('button');
    fab.id = '__bili_extractor_fab';
    fab.title = 'B站视频批量提取器';
    fab.textContent = '\u{1F4E5}';   // 📥
    document.body.appendChild(fab);

    /* ═══════════════════════════════════════════════
       主流程
       ═══════════════════════════════════════════════ */
    fab.addEventListener('click', function () {
        // 防止重复打开
        if (document.getElementById('__bili_extractor_overlay')) return;

        var uid = resolveUid();
        if (!uid) {
            var manual = prompt(
                '无法自动识别用户数字 UID！\n\n' +
                '当前路径: ' + location.pathname + '\n\n' +
                '请打开该用户主页，地址栏 space.bilibili.com/ 后面的数字即为 UID，\n' +
                '或者在任意视频页面评论区右侧可见 UP 主信息。\n\n' +
                '请输入数字 UID：'
            );
            if (manual && /^\d+$/.test(manual.trim())) {
                uid = manual.trim();
            } else {
                alert('UID 无效或已取消，脚本终止。');
                return;
            }
        }

        // 创建弹窗
        var overlay = document.createElement('div');
        overlay.id = '__bili_extractor_overlay';

        var card = document.createElement('div');
        card.id = '__bili_extractor_card';
        card.innerHTML = [
            '<h2 class="__be_title">B 站视频批量提取器</h2>',
            '<p class="__be_sub">已识别 UID: <b>' + uid + '</b></p>',
            '<p class="__be_path">' + location.href + '</p>',
            '<div class="__be_bar_wrap"><div class="__be_bar_fill"></div></div>',
            '<p class="__be_status">准备就绪，点击按钮开始提取</p>',
            '<button class="__be_btn __be_btn_primary" data-action="start">开始提取</button>',
            '<button class="__be_btn_ghost" data-action="close">取消</button>',
        ].join('');

        overlay.appendChild(card);
        document.body.appendChild(overlay);

        var barWrap = card.querySelector('.__be_bar_wrap');
        var barFill = card.querySelector('.__be_bar_fill');
        var statusEl = card.querySelector('.__be_status');
        var startBtn = card.querySelector('[data-action="start"]');
        var closeBtn = card.querySelector('[data-action="close"]');

        // 关闭弹窗
        function closeModal() { overlay.remove(); }
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });

        // ESC 关闭
        var escHandler = function (e) { if (e.key === 'Escape') closeModal(); };
        document.addEventListener('keydown', escHandler);

        // 开始提取
        startBtn.addEventListener('click', async function () {
            startBtn.disabled = true;
            startBtn.textContent = '提取中…';
            barWrap.style.display = 'block';

            try {
                // 1. 获取 WBI 密钥
                statusEl.textContent = '获取签名密钥…';
                var rawKey = await getWbiKeys();

                // 2. 第一页，获取总数
                statusEl.textContent = '获取视频列表…';
                var first = await fetchPage(uid, 1, rawKey);
                var total = first.page.count;
                var pages = Math.ceil(total / PAGE_SIZE);
                statusEl.textContent = '共 ' + total + ' 个视频，' + pages + ' 页，开始抓取…';

                var all = [];
                function processVlist(vlist) {
                    for (var i = 0; i < vlist.length; i++) {
                        var v = vlist[i];
                        all.push({
                            title: v.title || '',
                            bvid: v.bvid || '',
                            url: 'https://www.bilibili.com/video/' + (v.bvid || ''),
                            created: v.created ? new Date(v.created * 1000).toLocaleDateString('zh-CN') : '',
                            length: v.length || '',
                            play: typeof v.play === 'number' ? v.play : '',
                            danmaku: v.video_review != null ? v.video_review : '',
                            comment: v.comment != null ? v.comment : '',
                            desc: (v.description || '').replace(/[\r\n]+/g, ' ').substring(0, 200)
                        });
                    }
                }

                // 处理第一页
                if (first.list && first.list.vlist) processVlist(first.list.vlist);
                barFill.style.width = (100 / pages).toFixed(1) + '%';

                // 3. 抓取剩余页
                for (var pn = 2; pn <= pages; pn++) {
                    statusEl.textContent = '第 ' + pn + ' / ' + pages + ' 页（已收集 ' + all.length + ' 个视频）';
                    barFill.style.width = (pn * 100 / pages).toFixed(1) + '%';

                    await sleep(400 + Math.random() * 400);

                    var data = null;
                    for (var retry = 0; retry < 3; retry++) {
                        try {
                            data = await fetchPage(uid, pn, rawKey);
                            break;
                        } catch (e) {
                            if (retry < 2) {
                                statusEl.textContent = '第 ' + pn + ' 页失败，重试 (' + (retry + 1) + '/3)…';
                                await sleep(1500 * (retry + 1));
                            } else {
                                console.warn('[B站提取器] 第 ' + pn + ' 页跳过:', e.message);
                            }
                        }
                    }
                    if (data && data.list && data.list.vlist) processVlist(data.list.vlist);
                }

                // 4. 生成并下载 CSV
                statusEl.textContent = '完成！共 ' + all.length + ' 个视频，正在生成文件…';
                barFill.style.width = '100%';

                function esc(s) {
                    s = String(s);
                    if (s.indexOf('"') >= 0 || s.indexOf(',') >= 0 || s.indexOf('\n') >= 0 || s.indexOf('\r') >= 0) {
                        return '"' + s.replace(/"/g, '""') + '"';
                    }
                    return s;
                }

                var header = '标题,BV号,视频链接,发布时间,时长,播放量,弹幕数,评论数,简介';
                var rows = all.map(function (v) {
                    return [
                        esc(v.title), v.bvid, v.url, v.created,
                        esc(v.length), v.play, v.danmaku, v.comment, esc(v.desc)
                    ].join(',');
                });
                var csv = header + '\n' + rows.join('\n');
                var filename = 'bilibili_videos_' + uid + '_' + new Date().toISOString().slice(0, 10) + '.csv';

                downloadCSV(csv, filename);

                startBtn.textContent = '下载完成';
                startBtn.style.background = '#52c41a';
                statusEl.textContent = '已下载 ' + all.length + ' 个视频的 CSV 文件';
                document.removeEventListener('keydown', escHandler);

            } catch (e) {
                statusEl.textContent = '出错: ' + e.message;
                startBtn.textContent = '重试';
                startBtn.disabled = false;
                startBtn.style.background = '';
                console.error('[B站提取器]', e);
            }
        });
    });
})();
