
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { TopologyData, Node as TopologyNode } from '../types';
import { ICONS } from '../constants';
import ReactDOMServer from 'react-dom/server';

interface NetworkVisualizerProps {
  data: TopologyData;
}

const NetworkVisualizer: React.FC<NetworkVisualizerProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { nodes, links } = data;

  useEffect(() => {
    if (!svgRef.current || !nodes || !links) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const parent = svg.node()?.parentElement;
    if (!parent) return;

    const width = parent.clientWidth;
    const height = parent.clientHeight;
    svg.attr('width', width).attr('height', height);

    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(40));

    const link = svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", "#9ca3af")
      .attr("stroke-width", 1.5);

    const node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .attr("class", "cursor-grab active:cursor-grabbing");

    const iconHtml = (d: TopologyNode) => {
        const iconComponent = ICONS[d.type] || ICONS.unknown;
        return ReactDOMServer.renderToStaticMarkup(iconComponent);
    };

    node.append("circle")
      .attr("r", 20)
      .attr("fill", "#374151") // bg-gray-700
      .attr("stroke", "#4b5563") // bg-gray-600
      .attr("stroke-width", 2);

    node.append('g')
        .html(d => iconHtml(d));

    const labels = node.append("text")
      .text(d => d.name)
      .attr("x", 0)
      .attr("y", 35)
      .attr("text-anchor", "middle")
      .attr("fill", "#d1d5db") // text-gray-300
      .attr("font-family", "sans-serif")
      .attr("font-size", "12px");

    const drag = (simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>) => {
      function dragstarted(event: d3.D3DragEvent<Element, any, any>, d: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      function dragged(event: d3.D3DragEvent<Element, any, any>, d: any) {
        d.fx = event.x;
        d.fy = event.y;
      }
      function dragended(event: d3.D3DragEvent<Element, any, any>, d: any) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
    
    node.call(drag(simulation) as any);

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      node.attr("transform", d => `translate(${(d as any).x},${(d as any).y})`);
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, links]);

  return (
    <svg ref={svgRef} className="bg-gray-800 rounded-lg"></svg>
  );
};

export default NetworkVisualizer;
