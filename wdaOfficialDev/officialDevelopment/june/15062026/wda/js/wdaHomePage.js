document.addEventListener('DOMContentLoaded', () => {
    const toggles = document.querySelectorAll('.menu-toggle');
    const dropdowns = document.querySelectorAll('.dropdown');

    // 1. Handle Master Hamburger Triggers for each Navbar individually
    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const targetId = toggle.getAttribute('data-target');
            const targetMenu = document.getElementById(targetId);

            // Toggle active look for the individual hamburger button and its slider drawer
            toggle.classList.toggle('open');
            targetMenu.classList.toggle('open');
        });
    });

    // 2. Handle Independent Dropdown/Accordion Toggles inside both navbars
    dropdowns.forEach(dropdown => {
        const link = dropdown.querySelector('.nav-link');
        
        link.addEventListener('click', (e) => {
            // Check if the page is currently in mobile viewport boundaries
            if (window.innerWidth <= 768) {
                e.preventDefault(); // Stop native navigation redirect links
                
                const isActive = dropdown.classList.contains('active');
                
                // Find only matching dropdown scopes within the exact same parent navigation container
                const parentNav = dropdown.closest('.nav-menu');
                const siblingDropdowns = parentNav.querySelectorAll('.dropdown');
                
                // Close other open sub-accordions within this navbar alone
                siblingDropdowns.forEach(d => d.classList.remove('active'));
                
                if (!isActive) {
                    dropdown.classList.add('active');
                }
            }
        });
    });
});

//Food insecurity Trend----------------------------------------------------------------------------------------------------------------------
const hungerData = [
  { year: 2015, value: 589 },
  { year: 2016, value: 601 },
  { year: 2017, value: 615 },
  { year: 2018, value: 638 },
  { year: 2019, value: 581 },
  { year: 2020, value: 690 },
  { year: 2021, value: 725 },
  { year: 2022, value: 735 },
  { year: 2023, value: 733 }
];

const container = d3.select("#food-insecurity-chart");

// Robust width fallback to prevent 0px rendering bugs in hidden containers
const width = container.node().clientWidth || container.node().getBoundingClientRect().width || 300;
const height = 64;

const margin = { top: 4, right: 8, bottom: 14, left: 8 };

const svg = container
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .style("overflow", "visible"); // Prevents text clipping

// Definitions for Gradient AND Masking
const defs = svg.append("defs");

// Color Gradient
const gradient = defs
  .append("linearGradient")
  .attr("id", "foodGradient")
  .attr("x1", "0").attr("y1", "0")
  .attr("x2", "0").attr("y2", "1");

gradient.append("stop").attr("offset", "0%").attr("stop-color", "#ea580c").attr("stop-opacity", 0.35);
gradient.append("stop").attr("offset", "100%").attr("stop-color", "#ea580c").attr("stop-opacity", 0);

// Create an animated clip-path to sync the area fill with the line drawing
const clipPath = defs.append("clipPath")
  .attr("id", "clip-reveal");

const clipRect = clipPath.append("rect")
  .attr("x", 0)
  .attr("y", 0)
  .attr("width", 0) // Starts at 0 width
  .attr("height", height);

// Scales
const x = d3.scaleLinear()
  .domain(d3.extent(hungerData, d => d.year))
  .range([margin.left, width - margin.right]);

const y = d3.scaleLinear()
  .domain([
    d3.min(hungerData, d => d.value) - 20,
    d3.max(hungerData, d => d.value) + 10
  ])
  .range([height - margin.bottom, margin.top]);

// Generators
const area = d3.area()
  .x(d => x(d.year))
  .y0(height - margin.bottom)
  .y1(d => y(d.value))
  .curve(d3.curveCatmullRom.alpha(0.5));

const line = d3.line()
  .x(d => x(d.year))
  .y(d => y(d.value))
  .curve(d3.curveCatmullRom.alpha(0.5));

// Render Area (With synchronized clip-path reveal)
svg.append("path")
  .datum(hungerData)
  .attr("fill", "url(#foodGradient)")
  .attr("clip-path", "url(#clip-reveal)")
  .attr("d", area);

// Render Trend Line
const path = svg.append("path")
  .datum(hungerData)
  .attr("fill", "none")
  .attr("stroke", "#ea580c")
  .attr("stroke-width", 2)
  .attr("stroke-linecap", "round")
  .attr("stroke-linejoin", "round")
  .attr("d", line);

// Synchronized Animations
const totalLength = path.node().getTotalLength();
const duration = 1200;
const ease = d3.easeCubicOut;

// Animate Line
path
  .attr("stroke-dasharray", totalLength)
  .attr("stroke-dashoffset", totalLength)
  .transition()
  .duration(duration)
  .ease(ease)
  .attr("stroke-dashoffset", 0);

// Animate Area Reveal (Matches line movement)
clipRect
  .transition()
  .duration(duration)
  .ease(ease)
  .attr("width", width);

// Last data point marker (Fades in gently at the end)
const latest = hungerData[hungerData.length - 1];
svg.append("circle")
  .attr("cx", x(latest.year))
  .attr("cy", y(latest.value))
  .attr("r", 3.5)
  .attr("fill", "#ea580c")
  .attr("opacity", 0)
  .transition()
  .delay(duration * 0.8) // Appears right as the line reaches it
  .duration(300)
  .attr("opacity", 1);

// X-Axis Labels Loop
const labels = [2015, 2019, 2023];
labels.forEach(year => {
  let anchor = "middle";
  if (year === 2015) anchor = "start";
  if (year === 2023) anchor = "end";

  svg.append("text")
    .attr("x", x(year))
    .attr("y", height - 2)
    .attr("text-anchor", anchor)
    .attr("font-size", "9px")
    .attr("fill", "#6b7280")
    .attr("font-family", "sans-serif")
    .text(year);
});

//End of Food Security Trend-------------------------------------------------------------------------------------------------------------