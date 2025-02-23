import React from 'react';

function ProjectIframe({ docFolder }) {
  const projectName = process.env.PROJECT_NAME || 'docs-dev-mode'; // Fallback
  const iframeSrc = `/${projectName}/${docFolder}/index.html`; // Your iframe source

  return (
    <iframe src={iframeSrc} width="100%" height="600px" title="Project Documentation" />
  );
}

export default ProjectIframe;
