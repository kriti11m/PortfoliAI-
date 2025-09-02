// backend/src/utils/htmlGenerator.ts
export function generateHTML(data: any) {
  const name = data?.name || "Portfolio";
  const role = data?.role || "Professional";
  const bio = data?.bio || "";
  const skills = data?.skills || [];
  const projects = data?.projects || [];

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${name}'s Portfolio</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #333; border-bottom: 2px solid #007acc; }
          h2 { color: #666; }
          .bio { font-style: italic; margin: 20px 0; }
          .skills { display: flex; flex-wrap: wrap; gap: 10px; }
          .skill { background: #f0f8ff; padding: 5px 10px; border-radius: 5px; }
          .projects { margin-top: 30px; }
          .project { margin-bottom: 20px; padding: 15px; border-left: 3px solid #007acc; }
          .project-title { font-weight: bold; color: #333; }
          .project-desc { color: #666; margin-top: 5px; }
          .project-meta { font-size: 0.9em; color: #999; margin-top: 5px; }
        </style>
      </head>
      <body>
        <h1>${name}</h1>
        <h2>${role}</h2>
        ${bio ? `<div class="bio">${bio}</div>` : ''}
        
        <h3>Skills</h3>
        <div class="skills">
          ${skills.map((skill: string) => `<span class="skill">${skill}</span>`).join('')}
        </div>
        
        <div class="projects">
          <h3>Projects</h3>
          ${projects.map((project: any) => `
            <div class="project">
              <div class="project-title">${project.title || project.name || 'Untitled Project'}</div>
              <div class="project-desc">${project.description || 'No description'}</div>
              ${project.url ? `<div class="project-meta"><a href="${project.url}" target="_blank">View Project</a></div>` : ''}
              ${project.language ? `<div class="project-meta">Language: ${project.language}</div>` : ''}
              ${project.stars ? `<div class="project-meta">⭐ ${project.stars} stars</div>` : ''}
            </div>
          `).join('')}
        </div>
      </body>
    </html>
  `;
}
