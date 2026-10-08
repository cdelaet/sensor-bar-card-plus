// Standalone editor stylesheet, extracted verbatim. Hosts choose composition.
export const editorStyles = `
	        :host {
	          display: block;
	        }
	        .editor {
	          display: grid;
	          gap: 18px;
	          padding: 10px 0 14px;
	        }
	        .section {
	          display: grid;
	          gap: 14px;
	          padding: 14px;
	          background: color-mix(in srgb, var(--card-background-color, #fff) 88%, transparent);
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 35%, transparent);
	          border-radius: 14px;
	          box-shadow: 0 1px 0 color-mix(in srgb, var(--divider-color, #888) 20%, transparent);
	        }
	        .section-head {
	          display: grid;
	          gap: 4px;
	        }
	        .section h3 {
	          margin: 0;
	          font-size: 1rem;
	          font-weight: 700;
	          letter-spacing: 0.01em;
	          color: var(--primary-text-color, #111);
	        }
	        .section-note {
	          font-size: 0.82rem;
	          color: var(--secondary-text-color, #666);
	        }
	        .field-grid {
	          display: grid;
	          gap: 12px;
	        }
	        .editor-grid,
	        .field-row {
	          display: grid;
	          gap: 8px;
	          min-width: 0;
	        }
	        .inline-row {
	          display: grid;
	          gap: 12px;
	          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
	          align-items: end;
	        }
	        label {
	          font-size: 0.9rem;
	          font-weight: 500;
	          color: var(--primary-text-color, #111);
	          min-width: 0;
	        }
	        input,
	        select,
	        button {
	          font: inherit;
        }
        input[type="text"],
        input[type="number"],
	        input[type="color"],
	        select {
	          width: 100%;
	          box-sizing: border-box;
	          min-height: 42px;
	          padding: 8px 10px;
	          color: var(--primary-text-color, #111);
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 82%, transparent);
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 38%, transparent);
	          border-radius: 10px;
	        }
	        input[type="color"] {
	          padding: 4px;
	          cursor: pointer;
	        }
	        input[type="text"]:focus,
	        input[type="number"]:focus,
	        input[type="color"]:focus,
	        select:focus {
	          outline: 2px solid color-mix(in srgb, var(--accent-color, var(--primary-color, #03a9f4)) 55%, transparent);
	          outline-offset: 1px;
	        }
	        input[type="checkbox"] {
	          width: 18px;
	          height: 18px;
	        }
	        .toggle {
	          display: flex;
	          gap: 8px;
	          align-items: center;
	          flex-wrap: wrap;
	        }
	        .list {
	          display: grid;
	          gap: 10px;
	          min-width: 0;
	        }
	        .list-row {
	          display: grid;
	          gap: 10px;
	          grid-template-columns: minmax(0, 1fr) auto;
	          align-items: end;
	          min-width: 0;
	        }
        .generic-marker-list {
          gap: 8px;
        }
        .generic-marker-item {
          min-width: 0;
          overflow: hidden;
          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 32%, transparent);
          border-radius: 10px;
          background: color-mix(in srgb, var(--card-background-color, #fff) 82%, transparent);
        }
        .generic-marker-item[data-expanded="true"] {
          border-color: color-mix(in srgb, var(--accent-color, var(--primary-color, #03a9f4)) 38%, var(--divider-color, #888));
        }
        .generic-marker-header {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          padding: 6px 8px;
        }
        .generic-marker-toggle {
          display: grid;
          grid-template-columns: minmax(0, auto) minmax(0, 1fr);
          align-items: center;
          gap: 4px 10px;
          flex: 1 1 auto;
          min-width: 0;
          min-height: 40px;
          padding: 4px 6px;
          border: 0;
          background: transparent;
          text-align: left;
        }
        .generic-marker-toggle:hover,
        .generic-marker-toggle:focus {
          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 72%, transparent);
        }
        .generic-marker-title {
          font-weight: 700;
          white-space: nowrap;
        }
        .generic-marker-summary {
          min-width: 0;
          overflow: hidden;
          color: var(--secondary-text-color, #666);
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .generic-marker-actions {
          display: flex;
          flex: 0 0 auto;
          gap: 4px;
          align-items: center;
        }
        .generic-marker-actions button {
          min-width: 38px;
          min-height: 38px;
          padding: 6px;
        }
        .generic-marker-body {
          gap: 12px;
          padding: 12px;
          border-top: 1px solid color-mix(in srgb, var(--divider-color, #888) 25%, transparent);
          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 78%, transparent);
        }
        .generic-marker-pair,
        .generic-marker-options {
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          align-items: end;
        }
        .generic-marker-precision {
          max-width: 220px;
        }
	        .list-row.triple {
	          grid-template-columns: repeat(3, minmax(120px, 1fr)) auto;
	        }
	        .list-row.segment-row {
	          grid-template-columns: minmax(72px, 1fr) minmax(72px, 1fr) minmax(52px, 64px) 40px;
	          align-items: center;
	        }
	        .list-row.segment-row > * {
	          min-width: 0;
	        }
	        .list-row.segment-row > button {
	          width: 40px;
	          min-width: 40px;
	          padding: 6px;
	          justify-self: end;
	        }
	        .list-row.gradient-stop-row {
	          grid-template-columns: minmax(110px, 1fr) minmax(120px, 1fr) auto;
	        }
	        .gradient-stop-list {
	          display: grid;
	          gap: 10px;
	          min-width: 0;
	        }
	        .gradient-stop-draft {
	          padding-top: 10px;
	          border-top: 1px dashed color-mix(in srgb, var(--divider-color, #888) 34%, transparent);
	        }
	        .segment-editor-row {
	          display: grid;
	          gap: 6px;
	          min-width: 0;
	        }
	        .segment-draft {
	          display: grid;
	          gap: 6px;
	          padding-top: 10px;
	          border-top: 1px dashed color-mix(in srgb, var(--divider-color, #888) 34%, transparent);
	        }
	        .gradient-preview {
	          display: grid;
	          gap: 8px;
	          min-width: 0;
	        }
	        .gradient-preview-track {
	          position: relative;
	          width: 100%;
	          min-height: 28px;
	          min-width: 0;
	          border-radius: 999px;
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 28%, transparent);
	          background: linear-gradient(to right, #4CAF50 0%, #FF9800 50%, #F44336 100%);
	          box-shadow: inset 0 1px 0 color-mix(in srgb, var(--card-background-color, #fff) 35%, transparent);
	          overflow: hidden;
	        }
	        .gradient-preview-stop {
	          position: absolute;
	          top: 3px;
	          bottom: 3px;
	          width: 2px;
	          margin-left: -1px;
	          border-radius: 999px;
	          background: color-mix(in srgb, var(--primary-text-color, #111) 72%, transparent);
	          box-shadow: 0 0 0 1px color-mix(in srgb, var(--card-background-color, #fff) 52%, transparent);
	        }
	        .entity-shell {
	          display: grid;
	          gap: 10px;
	          padding: 12px;
	          min-width: 0;
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 68%, transparent);
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 30%, transparent);
	          border-radius: 14px;
	        }
	        .entity-main {
	          display: grid;
	          gap: 10px;
	          padding: 10px 12px 12px;
	          min-width: 0;
	          border-radius: 12px;
	          background: color-mix(in srgb, var(--card-background-color, #fff) 90%, transparent);
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 22%, transparent);
	        }
	        .entity-header {
	          display: grid;
	          gap: 12px;
	          grid-template-columns: minmax(0, 1fr) auto;
	          align-items: start;
	          padding-bottom: 4px;
	          border-bottom: 1px solid color-mix(in srgb, var(--divider-color, #888) 24%, transparent);
	        }
	        .entity-header-main {
	          display: grid;
	          gap: 4px;
	          min-width: 0;
	          flex: 1 1 auto;
	        }
	        .entity-title {
	          font-size: 0.95rem;
	          font-weight: 700;
	          color: var(--primary-text-color, #111);
	        }
	        .entity-subtitle {
	          font-size: 0.8rem;
	          color: var(--secondary-text-color, #666);
	          min-width: 0;
	          overflow: hidden;
	          text-overflow: ellipsis;
	          white-space: nowrap;
	        }
	        .entity-actions {
	          display: flex;
	          flex-wrap: wrap;
	          justify-content: flex-end;
	          align-items: center;
	          gap: 8px;
	          flex: 0 0 auto;
	          min-width: min(100%, 240px);
	        }
	        .entity-actions button {
	          min-height: 34px;
	          padding: 6px 10px;
	          flex: 0 1 auto;
	        }
	        .entity-fields {
	          display: grid;
	          gap: 10px;
	          min-width: 0;
	        }
	        .override-toggle {
	          display: inline-flex;
	          align-items: center;
	          gap: 8px;
	          justify-self: start;
	          padding: 8px 10px;
	          border-radius: 10px;
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 28%, transparent);
	          background: color-mix(in srgb, var(--card-background-color, #fff) 84%, transparent);
	          color: var(--secondary-text-color, #666);
	          transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
	        }
	        .override-toggle:hover,
	        .override-toggle:focus {
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 74%, transparent);
	          border-color: color-mix(in srgb, var(--accent-color, var(--primary-color, #03a9f4)) 28%, var(--divider-color, #888));
	          color: var(--primary-text-color, #111);
	        }
	        .override-toggle[aria-expanded="true"] {
	          color: var(--primary-text-color, #111);
	          border-color: color-mix(in srgb, var(--accent-color, var(--primary-color, #03a9f4)) 40%, transparent);
	          box-shadow: inset 3px 0 0 color-mix(in srgb, var(--accent-color, var(--primary-color, #03a9f4)) 70%, transparent);
	        }
	        .override-panel {
	          display: grid;
	          gap: 12px;
	          padding: 12px 14px;
	          min-width: 0;
	          border-radius: 12px;
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 28%, transparent);
	          border-left: 4px solid color-mix(in srgb, var(--accent-color, var(--primary-color, #03a9f4)) 65%, transparent);
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #ffffff)) 82%, transparent);
	        }
	        .override-panel::before {
	          content: "Overrides";
	          font-size: 0.78rem;
	          font-weight: 700;
	          letter-spacing: 0.04em;
	          text-transform: uppercase;
	          color: var(--secondary-text-color, #666);
	        }
	        .override-group {
	          display: grid;
	          gap: 10px;
	          min-width: 0;
	          --override-group-accent: var(--accent-color, var(--primary-color, #03a9f4));
	          border-radius: 12px;
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 24%, transparent);
	          background: color-mix(in srgb, var(--card-background-color, #fff) 78%, transparent);
	          overflow: hidden;
	        }
	        .override-group[data-group="scale"] {
	          --override-group-accent: #4f8dff;
	        }
	        .override-group[data-group="target"] {
	          --override-group-accent: #ff9b3d;
	        }
	        .override-group[data-group="baseline"] {
	          --override-group-accent: #5bbd6d;
	        }
	        .override-group[data-group="bar"] {
	          --override-group-accent: #34c6d3;
	        }
	        .override-group[data-group="needle"] {
	          --override-group-accent: #9b6bff;
	        }
	        .override-group[data-group="formatting"] {
	          --override-group-accent: #d46be3;
	        }
	        .override-group[data-group="layout"] {
	          --override-group-accent: #6e90ff;
	        }
	        .override-group[data-group="peak"] {
	          --override-group-accent: #f08b3e;
	        }
	        .override-group[data-group="segments"] {
	          --override-group-accent: #d2a53a;
	        }
	        .override-group[data-group="gradient-stops"] {
	          --override-group-accent: #48b978;
	        }
	        .card-subgroup {
	          margin-top: 2px;
	        }
	        .override-group.is-inactive .override-group-summary,
	        .override-group.is-inactive .section-note {
	          color: var(--secondary-text-color, #666);
	        }
	        .override-group.is-inactive .override-group-body {
	          opacity: 0.92;
	        }
	        .override-group-toggle {
	          display: flex;
	          justify-content: space-between;
	          align-items: flex-start;
	          gap: 12px;
	          width: 100%;
	          text-align: left;
	          border: 0;
	          border-radius: 0;
	          background: transparent;
	          padding: 10px 12px;
	          min-width: 0;
	        }
	        .override-group-toggle:hover,
	        .override-group-toggle:focus {
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 72%, transparent);
	        }
	        .override-group[data-expanded="true"] {
	          border-color: color-mix(in srgb, var(--override-group-accent) 34%, transparent);
	          box-shadow: inset 3px 0 0 color-mix(in srgb, var(--override-group-accent) 70%, transparent);
	        }
	        .override-group-title {
	          font-weight: 700;
	          color: var(--primary-text-color, #111);
	          min-width: 0;
	          overflow-wrap: anywhere;
	        }
	        .override-group-summary {
	          font-size: 0.82rem;
	          color: var(--secondary-text-color, #666);
	          text-align: right;
	          min-width: 0;
	          max-width: 42%;
	          white-space: nowrap;
	          overflow: hidden;
	          text-overflow: ellipsis;
	        }
	        .override-group-body {
	          display: grid;
	          gap: 12px;
	          padding: 0 12px 12px;
	          min-width: 0;
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 78%, transparent);
	        }
	        button {
	          min-height: 40px;
	          padding: 8px 12px;
	          cursor: pointer;
	          color: var(--primary-text-color, #111);
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 78%, transparent);
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 30%, transparent);
	          border-radius: 10px;
	        }
	        button:hover,
	        button:focus {
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 60%, transparent);
	        }
	        button:disabled {
	          cursor: not-allowed;
	          opacity: 0.58;
	          color: var(--secondary-text-color, #666);
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 86%, transparent);
	          border-color: color-mix(in srgb, var(--divider-color, #888) 22%, transparent);
	          box-shadow: none;
	        }
	        button:disabled:hover,
	        button:disabled:focus {
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 86%, transparent);
	        }
	        .field-row .field-grid {
	          gap: 8px;
	          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
	          align-items: end;
	        }
	        .field-row .field-grid > * {
	          min-width: 0;
	        }
	        ha-entity-picker {
	          min-width: 0;
	          width: 100%;
	        }
	        @media (max-width: 720px) {
	          .section {
	            gap: 12px;
	          }
	          .inline-row {
	            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	          }
	          .override-group-toggle {
	            flex-wrap: wrap;
	          }
	          .override-group-summary {
	            max-width: 100%;
	            flex: 1 1 100%;
	            text-align: left;
	          }
	          .entity-actions {
	            min-width: 0;
	            justify-content: flex-start;
	          }
	          .list-row.triple,
	          .list-row.gradient-stop-row {
	            grid-template-columns: repeat(2, minmax(0, 1fr));
	          }
	          .list-row.segment-row {
	            grid-template-columns: repeat(3, minmax(0, 1fr)) 40px;
	          }
	          .list-row.triple > button,
	          .list-row.gradient-stop-row > button {
	            grid-column: 1 / -1;
	            width: 100%;
	          }
	          .list-row.segment-row > button {
	            grid-column: auto;
	            width: 40px;
	          }
	        }
	        @media (max-width: 480px) {
	          .section {
	            padding: 12px;
	          }
	          .inline-row {
	            grid-template-columns: minmax(0, 1fr);
	          }
	          .entity-shell,
	          .entity-main,
	          .override-panel {
	            padding-left: 10px;
	            padding-right: 10px;
	          }
	          .entity-header {
	            grid-template-columns: minmax(0, 1fr);
	          }
	          .entity-actions {
	            width: 100%;
	          }
	          .entity-actions button {
	            flex: 1 1 120px;
	          }
	          .list-row {
	            grid-template-columns: minmax(0, 1fr);
	          }
	          .generic-marker-header {
	            flex-wrap: wrap;
	          }
	          .generic-marker-toggle {
	            flex-basis: 100%;
	          }
	          .generic-marker-actions {
	            width: 100%;
	          }
	          .generic-marker-actions button {
	            flex: 1 1 auto;
	          }
	          .generic-marker-pair,
	          .generic-marker-options {
	            grid-template-columns: minmax(0, 1fr);
	          }
	          .list-row.triple,
	          .list-row.gradient-stop-row {
	            grid-template-columns: minmax(0, 1fr);
	          }
	          .list-row.segment-row {
	            grid-template-columns: repeat(2, minmax(0, 1fr));
	          }
	          .list-row > button,
	          .list-row.triple > button,
	          .list-row.gradient-stop-row > button {
	            width: 100%;
	          }
	          .list-row.segment-row > button {
	            grid-column: 1 / -1;
	            width: 100%;
	          }
	        }
	      `;
