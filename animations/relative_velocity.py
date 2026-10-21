"""Original ManimGL explanations. Each teaching step lasts exactly four seconds.
Render with the pinned tools in requirements.txt; no LaTeX required.
Tamil/English teaching captions are supplied by the React player, not baked in.
"""
from manimlib import *

CYAN='#58c4dd'
CORAL='#fc8c8c'
GOLD='#ffff80'
GREEN='#83c167'

def text(value,point,size=34,color=WHITE):
    return Text(value,font='Arial',font_size=size,color=color).move_to(point)

def arrow(start,end,color):
    return Arrow(start,end,buff=0,stroke_width=7,fill_color=color,stroke_color=color)

class ObserverChange(Scene):
    def construct(self):
        a=arrow([-4,1.3,0],[2,1.3,0],CYAN)
        b=arrow([-4,-.3,0],[-.4,-.3,0],CORAL)
        labels=VGroup(text('A: 30 m/s',[0,2,0],color=CYAN),text('B: 18 m/s',[-2,-1,0],color=CORAL))
        frame=text('E',[5,2.4,0],48)
        formula=text('V_AB = V_AE - V_BE',[0,-2.6,0],42)
        self.play(ShowCreation(a),ShowCreation(b),FadeIn(labels),FadeIn(frame),Write(formula),run_time=2)
        self.wait(2)
        a2=arrow([-4,1.3,0],[-1.6,1.3,0],CYAN)
        zero=Dot([-4,-.3,0],color=CORAL,radius=.12)
        labels2=VGroup(text('A: 12 m/s',[-2,2,0],color=CYAN),text('B: 0 m/s',[-2,-1,0],color=CORAL))
        self.play(Transform(a,a2),ReplacementTransform(b,zero),Transform(labels,labels2),Transform(frame,text('B',[5,2.4,0],48)),Transform(formula,text('30 - 18 = 12 m/s',[0,-2.6,0],42)),run_time=2)
        self.wait(2)
        self.play(FadeOut(VGroup(a,zero,labels,frame,formula)),run_time=.5)
        forward=arrow([-4,.7,0],[2,.7,0],CYAN)
        reverse=arrow([2,-.1,0],[-1.6,-.1,0],CORAL)
        result=arrow([-4,-1,0],[-1.6,-1,0],GOLD)
        triangle=VGroup(forward,reverse,result,text('30',[-1,1.4,0],color=CYAN),text('-18',[.2,-.7,0],color=CORAL),text('12',[-2.8,-1.6,0],color=GOLD))
        self.play(ShowCreation(forward),FadeIn(triangle[3]),run_time=1)
        self.play(ShowCreation(reverse),ShowCreation(result),FadeIn(VGroup(*triangle[4:])),run_time=1.5)
        self.wait(1)
        self.play(FadeOut(triangle),run_time=.5)
        line=Line([-5,-.8,0],[5,-.8,0],color=GREY)
        shipA=VGroup(Triangle(color=CYAN,fill_opacity=1).scale(.25),text('A',[0,.55,0],28,CYAN)).move_to([-3,0,0])
        shipB=VGroup(Square(color=CORAL,fill_opacity=1).scale(.18),text('B',[0,.55,0],28,CORAL)).move_to([2,0,0])
        note=text('B = 0     A = +12 m/s',[0,2,0],40)
        self.add(line,shipA,shipB,note)
        self.play(shipA.animate.shift(3*RIGHT),run_time=3,rate_func=linear)
        self.wait(.5)
        self.play(FadeOut(VGroup(line,shipA,shipB,note)),run_time=.5)
        final=VGroup(text('V_AB = +12 m/s',[0,.8,0],46,CYAN),text('V_BA = -12 m/s',[0,-.8,0],46,CORAL))
        self.play(FadeIn(final),run_time=1.5)
        self.wait(2)

class RiverStrategies(Scene):
    def construct(self):
        water=Rectangle(width=10,height=3,fill_color='#174a63',fill_opacity=1,stroke_width=0)
        banks=VGroup(Line([-5,-1.5,0],[5,-1.5,0],color=GREEN,stroke_width=7),Line([-5,1.5,0],[5,1.5,0],color=GREEN,stroke_width=7))
        info=text('W = 1200 m     u = 5 m/s     c = 3 m/s',[0,2.7,0],32)
        current=arrow([2,.2,0],[4,.2,0],CORAL)
        self.play(FadeIn(water),ShowCreation(banks),Write(info),ShowCreation(current),run_time=2)
        self.wait(2)
        straight=arrow([-2,-1.5,0],[-2,1.5,0],CYAN)
        drift=arrow([-2,1.5,0],[-.2,1.5,0],CORAL)
        path=Line([-2,-1.5,0],[-.2,1.5,0],color=GOLD,stroke_width=6)
        equation=text('t = 1200 / 5 = 240 s',[0,-2.6,0],38)
        self.play(ShowCreation(straight),ShowCreation(drift),ShowCreation(path),Write(equation),run_time=2)
        self.wait(2)
        direct=Line([-2,-1.5,0],[-2,1.5,0],color=GOLD,stroke_width=6)
        aim=arrow([-2,-1.5,0],[-3.8,.9,0],CYAN)
        cancel=arrow([-3.8,.9,0],[-2,.9,0],CORAL)
        self.play(Transform(straight,aim),Transform(drift,cancel),Transform(path,direct),Transform(equation,text('sin θ = 3 / 5     θ = 36.87°',[0,-2.6,0],38)),run_time=2)
        self.wait(2)
        self.play(Transform(equation,text('v_y = 4 m/s     t = 1200 / 4 = 300 s',[0,-2.6,0],32)),run_time=1)
        dot=Dot([-2,-1.5,0],color=WHITE,radius=.13);self.add(dot)
        self.play(dot.animate.move_to([-2,1.5,0]),run_time=2,rate_func=linear)
        self.wait(1)
        self.play(FadeOut(VGroup(water,banks,info,current,straight,drift,path,equation,dot)),run_time=.5)
        comparison=VGroup(text('240 s   →   720 m',[0,1,0],46,CYAN),text('300 s   →   0 m',[0,-1,0],46,GOLD))
        self.play(FadeIn(comparison),run_time=1.5)
        self.wait(2)
