'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/lib/theme-context';
import styles from './ThemeToggle.module.css';

/* ─────────────────────────────────────────────────────────
   ThemeToggle — high-fidelity skeuomorphic day / night switch
   Converted from raw HTML/CSS/Babel into Next.js + CSS Modules
   ───────────────────────────────────────────────────────── */

/* ── Back clouds (grey, behind the bear) ── */
function BackCloudsSvg() {
  return (
    <svg
      aria-hidden="true"
      className={`${styles.backdrop} ${styles.backClouds}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 290 228"
    >
      <g className={styles.clouds}>
        <path
          fill="#D9D9D9"
          d="M335 147.5c0 27.89-22.61 50.5-50.5 50.5a50.78 50.78 0 0 1-9.29-.853c-2.478 12.606-10.595 23.188-21.615 29.011C245.699 243.749 228.03 256 207.5 256a50.433 50.433 0 0 1-16.034-2.599A41.811 41.811 0 0 1 166 262a41.798 41.798 0 0 1-22.893-6.782A42.21 42.21 0 0 1 135 256a41.82 41.82 0 0 1-19.115-4.592A41.84 41.84 0 0 1 88 262c-1.827 0-3.626-.117-5.391-.343C74.911 270.448 63.604 276 51 276c-23.196 0-42-18.804-42-42s18.804-42 42-42c1.827 0 3.626.117 5.391.343C64.089 183.552 75.396 178 88 178a41.819 41.819 0 0 1 19.115 4.592C114.532 176.002 124.298 172 135 172a41.798 41.798 0 0 1 22.893 6.782 42.066 42.066 0 0 1 7.239-.773C174.137 164.159 189.749 155 207.5 155c.601 0 1.199.01 1.794.031A41.813 41.813 0 0 1 234 147h.002c.269-27.66 22.774-50 50.498-50 27.89 0 50.5 22.61 50.5 50.5Z"
        />
      </g>
    </svg>
  );
}

/* ── Front clouds (white, in front of the bear) ── */
function FrontCloudsSvg() {
  return (
    <svg
      aria-hidden="true"
      className={`${styles.backdrop} ${styles.frontClouds}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 290 228"
    >
      <g className={styles.clouds}>
        {/* Main cloud mass */}
        <path
          fill="#fff"
          d="M328 167.5c0 15.214-7.994 28.56-20.01 36.068.007.31.01.621.01.932 0 23.472-19.028 42.5-42.5 42.5-3.789 0-7.461-.496-10.957-1.426C249.671 263.676 233.141 277 213.5 277a42.77 42.77 0 0 1-7.702-.696C198.089 284.141 187.362 289 175.5 289a42.338 42.338 0 0 1-27.864-10.408A42.411 42.411 0 0 1 133.5 281c-4.36 0-8.566-.656-12.526-1.876C113.252 287.066 102.452 292 90.5 292a42.388 42.388 0 0 1-15.8-3.034A42.316 42.316 0 0 1 48.5 298C25.028 298 6 278.972 6 255.5S25.028 213 48.5 213a42.388 42.388 0 0 1 15.8 3.034A42.316 42.316 0 0 1 90.5 207c4.36 0 8.566.656 12.526 1.876C110.748 200.934 121.548 196 133.5 196a42.338 42.338 0 0 1 27.864 10.408A42.411 42.411 0 0 1 175.5 204c2.63 0 5.204.239 7.702.696C190.911 196.859 201.638 192 213.5 192c3.789 0 7.461.496 10.957 1.426 2.824-10.491 9.562-19.377 18.553-24.994-.007-.31-.01-.621-.01-.932 0-23.472 19.028-42.5 42.5-42.5s42.5 19.028 42.5 42.5Z"
        />
        {/* Extra cloud puffs for heavier sky coverage */}
        <ellipse cx="60" cy="190" rx="45" ry="28" fill="#fff" />
        <ellipse cx="140" cy="185" rx="50" ry="30" fill="#fff" />
        <ellipse cx="220" cy="188" rx="42" ry="26" fill="#fff" />
        <ellipse cx="30" cy="180" rx="35" ry="22" fill="rgba(255,255,255,0.85)" />
        <ellipse cx="100" cy="175" rx="38" ry="24" fill="rgba(255,255,255,0.9)" />
        <ellipse cx="180" cy="178" rx="40" ry="25" fill="rgba(255,255,255,0.9)" />
        <ellipse cx="260" cy="180" rx="35" ry="22" fill="rgba(255,255,255,0.85)" />
        {/* Top cloud wisps */}
        <ellipse cx="80" cy="165" rx="30" ry="18" fill="rgba(255,255,255,0.6)" />
        <ellipse cx="200" cy="168" rx="32" ry="16" fill="rgba(255,255,255,0.55)" />
        <ellipse cx="150" cy="162" rx="28" ry="15" fill="rgba(255,255,255,0.5)" />
      </g>
    </svg>
  );
}

/* ── 4-pointed sparkle stars ── */
function StarsSvg() {
  return (
    <svg
      aria-hidden="true"
      className={`${styles.backdrop} ${styles.starsLayer}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 290 228"
    >
      <g>
        <g className={`${styles.stars} ${styles.starsGroup}`}>
          <g>
            <path fill="#fff" fillRule="evenodd" d="M61 11.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.749 3.749 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.749 3.749 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813a3.749 3.749 0 0 0 2.576-2.576l.813-2.846A.75.75 0 0 1 61 11.5Z" clipRule="evenodd" />
          </g>
          <g>
            <path fill="#fff" fillRule="evenodd" d="M62.5 45.219a.329.329 0 0 1 .315.238l.356 1.245a1.641 1.641 0 0 0 1.127 1.127l1.245.356a.328.328 0 0 1 0 .63l-1.245.356a1.641 1.641 0 0 0-1.127 1.127l-.356 1.245a.328.328 0 0 1-.63 0l-.356-1.245a1.641 1.641 0 0 0-1.127-1.127l-1.245-.356a.328.328 0 0 1 0-.63l1.245-.356a1.641 1.641 0 0 0 1.127-1.127l.356-1.245a.328.328 0 0 1 .315-.238Z" clipRule="evenodd" />
          </g>
          <g>
            <path fill="#fff" fillRule="evenodd" d="M32 31.188a.28.28 0 0 1 .27.204l.305 1.067a1.405 1.405 0 0 0 .966.966l1.068.305a.28.28 0 0 1 0 .54l-1.068.305a1.405 1.405 0 0 0-.966.966l-.305 1.068a.28.28 0 0 1-.54 0l-.305-1.068a1.406 1.406 0 0 0-.966-.966l-1.067-.305a.28.28 0 0 1 0-.54l1.067-.305a1.406 1.406 0 0 0 .966-.966l.305-1.068a.281.281 0 0 1 .27-.203Z" clipRule="evenodd" />
          </g>
          <g>
            <path fill="#fff" fillRule="evenodd" d="M41.5 74.219a.329.329 0 0 1 .315.238l.356 1.245a1.641 1.641 0 0 0 1.127 1.127l1.245.356a.328.328 0 0 1 0 .63l-1.245.356a1.641 1.641 0 0 0-1.127 1.127l-.356 1.245a.328.328 0 0 1-.63 0l-.356-1.245a1.641 1.641 0 0 0-1.127-1.127l-1.245-.356a.328.328 0 0 1 0-.63l1.245-.356a1.641 1.641 0 0 0 1.127-1.127l.356-1.245a.328.328 0 0 1 .315-.238Z" clipRule="evenodd" />
          </g>
          <g>
            <path fill="#fff" fillRule="evenodd" d="M34 83.188a.28.28 0 0 1 .27.203l.305 1.068a1.405 1.405 0 0 0 .966.966l1.068.305a.28.28 0 0 1 0 .54l-1.068.305a1.405 1.405 0 0 0-.966.966l-.305 1.068a.28.28 0 0 1-.54 0l-.305-1.068a1.406 1.406 0 0 0-.966-.966l-1.068-.305a.28.28 0 0 1 0-.54l1.068-.305a1.406 1.406 0 0 0 .966-.966l.305-1.068a.281.281 0 0 1 .27-.204Z" clipRule="evenodd" />
          </g>
          <g>
            <path fill="#fff" fillRule="evenodd" d="M63 89.25a.375.375 0 0 1 .36.272l.407 1.423a1.874 1.874 0 0 0 1.288 1.288l1.423.406a.374.374 0 0 1 0 .722l-1.423.406a1.874 1.874 0 0 0-1.288 1.288l-.407 1.423a.374.374 0 0 1-.72 0l-.407-1.423a1.874 1.874 0 0 0-1.288-1.288l-1.423-.406a.374.374 0 0 1 0-.722l1.423-.406a1.874 1.874 0 0 0 1.288-1.288l.407-1.423a.376.376 0 0 1 .36-.272Z" clipRule="evenodd" />
          </g>
          <g>
            <path fill="#fff" fillRule="evenodd" d="M110.5 53.156a.236.236 0 0 1 .225.17l.254.89a1.174 1.174 0 0 0 .805.805l.89.254a.233.233 0 0 1 0 .45l-.89.254a1.167 1.167 0 0 0-.805.805l-.254.89a.235.235 0 0 1-.45 0l-.254-.89a1.174 1.174 0 0 0-.805-.805l-.89-.254a.233.233 0 0 1 0-.45l.89-.254a1.167 1.167 0 0 0 .805-.805l.254-.89a.232.232 0 0 1 .225-.17Z" clipRule="evenodd" />
          </g>
          <g>
            <path fill="#fff" fillRule="evenodd" d="M120 27.188a.279.279 0 0 1 .27.204l.305 1.067a1.41 1.41 0 0 0 .966.966l1.067.305a.286.286 0 0 1 0 .54l-1.067.305a1.403 1.403 0 0 0-.966.966l-.305 1.067a.279.279 0 0 1-.54 0l-.305-1.067a1.41 1.41 0 0 0-.966-.966l-1.068-.305a.286.286 0 0 1 0-.54l1.068-.305a1.405 1.405 0 0 0 .966-.966l.305-1.067a.279.279 0 0 1 .27-.204Z" clipRule="evenodd" />
          </g>
          <g>
            <path fill="#fff" fillRule="evenodd" d="M155 28.5a.753.753 0 0 1 .721.544l.813 2.846a3.746 3.746 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.746 3.746 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813a3.75 3.75 0 0 0 2.576-2.576l.813-2.846A.751.751 0 0 1 155 28.5Z" clipRule="evenodd" />
          </g>
          <g>
            <path fill="#fff" fillRule="evenodd" d="M147 60.25a.377.377 0 0 1 .36.272l.407 1.423a1.883 1.883 0 0 0 1.288 1.288l1.423.407a.375.375 0 0 1 0 .72l-1.423.407a1.875 1.875 0 0 0-1.288 1.288l-.407 1.423a.377.377 0 0 1-.72 0l-.407-1.423a1.883 1.883 0 0 0-1.288-1.288l-1.423-.406a.375.375 0 0 1 0-.722l1.423-.406a1.875 1.875 0 0 0 1.288-1.288l.407-1.423a.372.372 0 0 1 .36-.272Z" clipRule="evenodd" />
          </g>
          <g>
            <path fill="#fff" fillRule="evenodd" d="M125.5 76.344a.513.513 0 0 1 .496.374l.559 1.956a2.574 2.574 0 0 0 1.771 1.771l1.956.56a.514.514 0 0 1 0 .991l-1.956.559a2.57 2.57 0 0 0-1.771 1.77l-.559 1.957a.514.514 0 0 1-.992 0l-.559-1.956a2.574 2.574 0 0 0-1.771-1.771l-1.956-.56a.514.514 0 0 1 0-.991l1.956-.559a2.57 2.57 0 0 0 1.771-1.77l.559-1.957a.515.515 0 0 1 .496-.374Z" clipRule="evenodd" />
          </g>
        </g>
      </g>
    </svg>
  );
}

/* ── Astronaut Bear + Rocket ── */
function AstronautBearSvg() {
  return (
    <span className={styles.pilotContainer}>
      <svg
        className={styles.pilotBear}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 1448 938"
      >
        {/* Bear body (brown) */}
        <mask id="tb-a" fill="#fff">
          <path fillRule="evenodd" d="M869.02 210.61c16.067-3.967 27.98-18.476 27.98-35.768C897 154.495 880.505 138 860.158 138c-14.337 0-26.761 8.19-32.85 20.146C815.313 151.674 801.586 148 787 148h-20c-14.52 0-28.19 3.641-40.146 10.059C720.749 146.15 708.351 138 694.048 138c-20.347 0-36.842 16.495-36.842 36.842 0 17.222 11.818 31.685 27.787 35.72A85.104 85.104 0 0 0 682 233v225c0 12.15 9.85 22 22 22h44c12.15 0 22-9.85 22-22v-28.69a41.072 41.072 0 0 0 14 .174V458c0 12.15 9.85 22 22 22h44c12.15 0 22-9.85 22-22v-74.797a28.992 28.992 0 0 0 6.946-5.137l44.548-44.548c11.325-11.325 11.325-29.687 0-41.012s-29.687-11.325-41.012 0L872 302.988V233a85.094 85.094 0 0 0-2.98-22.39Z" clipRule="evenodd"/>
        </mask>
        <path fill="#AF7128" fillRule="evenodd" d="M869.02 210.61c16.067-3.967 27.98-18.476 27.98-35.768C897 154.495 880.505 138 860.158 138c-14.337 0-26.761 8.19-32.85 20.146C815.313 151.674 801.586 148 787 148h-20c-14.52 0-28.19 3.641-40.146 10.059C720.749 146.15 708.351 138 694.048 138c-20.347 0-36.842 16.495-36.842 36.842 0 17.222 11.818 31.685 27.787 35.72A85.104 85.104 0 0 0 682 233v225c0 12.15 9.85 22 22 22h44c12.15 0 22-9.85 22-22v-28.69a41.072 41.072 0 0 0 14 .174V458c0 12.15 9.85 22 22 22h44c12.15 0 22-9.85 22-22v-74.797a28.992 28.992 0 0 0 6.946-5.137l44.548-44.548c11.325-11.325 11.325-29.687 0-41.012s-29.687-11.325-41.012 0L872 302.988V233a85.094 85.094 0 0 0-2.98-22.39Z" clipRule="evenodd"/>

        {/* Bear outline */}
        <path fill="#000" d="m869.02 210.61-5.789 1.577-1.614-5.929 5.965-1.473 1.438 5.825Zm-41.712-52.464 5.347 2.723-2.789 5.476-5.407-2.918 2.849-5.281Zm-100.454-.087 2.838 5.287-5.388 2.892-2.789-5.442 5.339-2.737Zm-41.861 52.503 1.47-5.817 5.928 1.498-1.61 5.899-5.788-1.58ZM770 429.31h-6v-7.218l7.097 1.319L770 429.31Zm14 .174-.95-5.925 6.95-1.114v7.039h-6Zm88-46.281h-6v-3.613l3.194-1.69 2.806 5.303Zm6.946-5.137 4.243 4.243-4.243-4.243Zm44.548-44.548-4.243-4.242 4.243 4.242Zm0-41.012 4.243-4.242-4.243 4.242Zm-41.012 0 4.242 4.243-4.242-4.243ZM872 302.988l4.243 4.243L866 317.473v-14.485h6Z" mask="url(#tb-a)"/>

        {/* Helmet stripe */}
        <path fill="#FF1E1E" d="M821.678 205.665h-88.371v13.25h88.371z"/>

        {/* Helmet visor */}
        <path fill="#000" fillRule="evenodd" d="M709.7 164.481c-17.939 14.394-28.018 37.148-28.018 57.504h61.648c.087-13.669 11.194-24.723 24.883-24.723h18.56c13.689 0 24.796 11.054 24.883 24.723H873c0-20.356-10.078-43.11-28.018-57.504C827.043 150.086 802.711 142 777.341 142c-25.37 0-49.701 8.086-67.641 22.481Z" clipRule="evenodd"/>
        <path fill="url(#tb-b)" fillOpacity=".4" fillRule="evenodd" d="M709.7 164.481c-17.939 14.394-28.018 37.148-28.018 57.504h61.648c.087-13.669 11.194-24.723 24.883-24.723h18.56c13.689 0 24.796 11.054 24.883 24.723H873c0-20.356-10.078-43.11-28.018-57.504C827.043 150.086 802.711 142 777.341 142c-25.37 0-49.701 8.086-67.641 22.481Z" clipRule="evenodd"/>

        {/* Eyes */}
        <circle cx="8.079" cy="8.079" r="8.079" fill="#000" transform="matrix(-1 0 0 1 730.414 240)"/>
        <circle cx="8.079" cy="8.079" r="8.079" fill="#000" transform="matrix(-1 0 0 1 839 240)"/>

        {/* Nose / mouth */}
        <path fill="#000" d="M755.835 262.683c0 8.21 9.868 17.451 20.845 17.451 10.977 0 20.845-9.241 20.845-17.451s-9.868-12.281-20.845-12.281c-10.977 0-20.845 4.071-20.845 12.281Z"/>

        {/* Paws */}
        <path stroke="#000" strokeLinecap="round" strokeWidth="6" d="M738 464v12m-24-12v12m127-12v12m-24-12v12"/>

        {/* Suit bands */}
        <path fill="#707070" stroke="#000" strokeWidth="6" d="M687 370v16h183v-16zm0-54v16h183v-16z"/>
        <path fill="#D9D9D9" stroke="#000" strokeWidth="6" d="M795 370h-28v16h28zm76-69h-16v95h16zm-172 0h-16v95h16z"/>

        {/* Arm */}
        <rect width="74.266" height="52" x="-3" y="3" fill="#AF7128" stroke="#000" strokeWidth="6" rx="26" transform="matrix(-1 0 0 1 732 316)"/>
        <path fill="#000" d="M722 354a3 3 0 1 1 0-6v6Zm12 0h-12v-6h12v6Zm-12-12a3 3 0 1 1 0-6v6Zm12 0h-12v-6h12v6Z"/>

        {/* Rocket body struts */}
        <path fill="#494949" d="m323.749 728.949 12.392-12.694 157.087 153.35-12.392 12.694z"/>
        <path fill="#494949" d="m468.695 876.651-11.898-13.158 162.83-147.237 11.899 13.158z"/>

        {/* Rocket window */}
        <path fill="#6FB7D6" fillOpacity=".53" d="M415 372.657 643.398 213v159.657H415Z"/>
        <path fill="url(#tb-c)" fillOpacity=".4" d="M415 372.657 643.398 213v159.657H415Z"/>

        {/* Rocket structure */}
        <path fill="#000" d="M59.871 212.892H95.35v656.367H59.871z"/>
        <path fill="#000" d="M106.438 523.336v35.479H59.871v-35.479z"/>
        <path fill="#FE1616" d="M59.871 212.892H95.35v35.479H59.871zm0 620.888H95.35v35.479H59.871z"/>
        <ellipse cx="59.871" cy="539.966" fill="url(#tb-d)" rx="59.871" ry="38.806"/>
        <path fill="#5B5B5B" d="M106.438 441.29h53.219v199.571h-53.219z"/>

        {/* Rocket body panel */}
        <path fill="#D9D9D9" fillRule="evenodd" d="M1359.3 372.549H159.657v337.053H949.06l410.24-236.853v-100.2Z" clipRule="evenodd"/>
        <path fill="url(#tb-e)" fillOpacity=".4" fillRule="evenodd" d="M1359.3 372.549H159.657v337.053H949.06l410.24-236.853v-100.2Z" clipRule="evenodd"/>

        {/* Rocket texture */}
        <path fill="url(#tb-f)" d="M281.617 408.028h263.877v263.877H281.617z"/>

        {/* Red accent bands */}
        <path fill="#FF0B0B" d="M192.919 709.602h443.492V798.3H192.919z"/>
        <path fill="url(#tb-g)" fillOpacity=".3" d="M192.919 709.602h443.492V798.3H192.919z"/>
        <path fill="#FF0B0B" d="M192.919.016h443.492v88.698H192.919z"/>
        <path fill="url(#tb-h)" fillOpacity=".28" d="M192.919.016h443.492v88.698H192.919z"/>
        <path fill="#FF0B0B" d="M1175.25 396.941h221.746v44.349H1175.25z"/>
        <path fill="url(#tb-i)" fillOpacity=".2" d="M1175.25 396.941h221.746v44.349H1175.25z"/>

        {/* Rocket nose cone */}
        <path fill="#F20000" d="M1301.65 212.892H1448l-90.92 159.657h-148.57l93.14-159.657Z"/>
        <path fill="url(#tb-j)" fillOpacity=".2" d="M1301.65 212.892H1448l-90.92 159.657h-148.57l93.14-159.657Z"/>

        {/* Rocket exhaust */}
        <circle cx="476.754" cy="869.259" r="68.741" fill="url(#tb-k)"/>

        {/* Vertical struts */}
        <path fill="#494949" d="M223.963 88.714h33.262v620.888h-33.262zm345.923 0h33.262v620.888h-33.262z"/>

        {/* Gradients */}
        <defs>
          <linearGradient id="tb-b" x1="682" x2="860" y1="205" y2="182" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff"/>
            <stop offset=".375" stopColor="#fff" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="tb-c" x1="444" x2="643" y1="325" y2="321" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff"/>
            <stop offset=".443" stopColor="#fff" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="tb-d" x1="0" x2="119.743" y1="541.075" y2="541.075" gradientUnits="userSpaceOnUse">
            <stop offset=".25" stopColor="#FF2626"/>
            <stop offset=".25"/>
          </linearGradient>
          <linearGradient id="tb-e" x1="1232" x2="160" y1="521" y2="521" gradientUnits="userSpaceOnUse">
            <stop/>
            <stop offset="1" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="tb-g" x1="626" x2="208" y1="754" y2="754" gradientUnits="userSpaceOnUse">
            <stop/>
            <stop offset="1" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="tb-h" x1="636" x2="193" y1="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop/>
            <stop offset="1" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="tb-i" x1="1380" x2="1028" y1="419" y2="419" gradientUnits="userSpaceOnUse">
            <stop/>
            <stop offset="1" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="tb-j" x1="1362" x2="1156" y1="273" y2="279" gradientUnits="userSpaceOnUse">
            <stop/>
            <stop offset="1" stopOpacity="0"/>
          </linearGradient>
          <radialGradient id="tb-k" cx="0" cy="0" r="1" gradientTransform="rotate(90 -196.253 673.007) scale(68.7412)" gradientUnits="userSpaceOnUse">
            <stop offset=".51" stopColor="#fff"/>
            <stop offset=".51"/>
          </radialGradient>
          <pattern id="tb-f" width="1" height="1" patternContentUnits="objectBoundingBox">
            <use href="#tb-l" transform="scale(.0033)"/>
          </pattern>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <image href="data:image/png;base64,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" id="tb-l" width="300" height="300"/>
        </defs>
      </svg>
    </span>
  );
}

/* ── Main component ── */
export function ThemeToggle() {
  const { mode, toggleMode } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  /* Avoid hydration mismatch — render placeholder until client-side */
  if (!mounted) {
    return <div className={styles.placeholder} />;
  }

  const isDark = mode === 'dark';

  return (
    <button
      className={styles.toggle}
      onClick={toggleMode}
      aria-pressed={isDark}
      title="Toggle Dark Mode"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
      style={{
        '--dark': isDark ? 1 : 0,
        backgroundColor: isDark ? '#1e293b' : '#5b9bd5',
      } as React.CSSProperties}
    >
      <span className={styles.content}>
        {/* Layer 1: Grey clouds (behind bear) */}
        <BackCloudsSvg />

        {/* Layer 2: Astronaut bear */}
        <AstronautBearSvg />

        {/* Layer 3: White clouds (in front of bear) */}
        <FrontCloudsSvg />

        {/* Layer 4: Sparkle stars */}
        <StarsSvg />

        {/* Layer 5: Sun / Moon indicator */}
        {/* Layer 5: Moon glow (behind indicator, dark mode only) */}
        <span className={styles.indicatorWrapper}>
          <span className={styles.moonGlow} />
          <span className={styles.indicator}>
            <span className={styles.starWrap}>
              <span className={styles.sun} />
              <span className={styles.moon}>
                <span className={styles.crater} />
                <span className={styles.crater} />
                <span className={styles.crater} />
              </span>
            </span>
          </span>
        </span>
      </span>
    </button>
  );
}
