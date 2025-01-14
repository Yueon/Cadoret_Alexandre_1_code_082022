import { Component, Inject, OnInit } from "@angular/core";
import { BehaviorSubject, catchError, EMPTY, of, map, Observable, take, tap, switchMap } from "rxjs";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { DOCUMENT } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";

import { AuthService } from 'src/app/services/auth.service';
import { PublicationsService } from 'src/app/services/publications.service';
import { MessagesService } from 'src/app/services/messages.service';
import { UserService } from 'src/app/services/user.service';

import { PostModel } from 'src/app/interfaces/posts'; 
import { UserModel } from "src/app/interfaces/user";
import { HttpResponse } from 'src/app/interfaces/http-response';
import { UpdatePostComponent } from "../update-post/update-post.component";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-post-wall',
  templateUrl: './post-wall.component.html',
  styleUrls: ['./post-wall.component.scss']
})
export class PostWallComponent implements OnInit {
  loading!: boolean;
  obsArrayContent: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  content$: Observable<any> = this.obsArrayContent.asObservable();
  user: UserModel | undefined;
  userid: any | undefined;
  postId!: any;
  post!: PostModel;
  posterId!: string;
  like!: number;
  liked!: boolean;
  disliked!: boolean;
  commentsForm!: FormGroup;

  constructor(
    private publicationsService: PublicationsService,
    public authService: AuthService,
    private formBuilder: FormBuilder,
    private messagesService: MessagesService,
    public userService: UserService,
    private dialog: MatDialog,
    @Inject(DOCUMENT) private document: any,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    console.log("je suis les post",this.content$)
    this.loading = true;
    this.userService.user$
      .pipe(
        tap((user) => {
          this.user = user;
        })
      )
      .subscribe();
    
      this.userid = this.authService.getUserId();
      console.log('userid:', this.userid)
      this.router.routeReuseStrategy.shouldReuseRoute = function () {
        return false;
      };
      this.publicationsService
        .getPublications()
        .pipe(
          tap(() => {
              this.loading = false;
          })
      )
        .subscribe((data) => {
          this.obsArrayContent.next(data);
        });
        this.commentsForm = this.formBuilder.group({
          text: [null, [Validators.required, Validators.maxLength(1000)]],
      });
}

onLike(post: any, index: number) {
  if(post.usersDisliked.includes(this.user?._id)){
  }else{
  if(post.usersLiked.includes(this.user?._id)) {
    this.like = 0;
    this.publicationsService.likePost(post._id, this.like).subscribe((data) => {
        this.content$
            .pipe(
                take(1),
                map((data) => {
                    data[index].likes--;
                    return data;}))
            this.publicationsService.getPublications()
              .subscribe((newArr) => {
                  this.obsArrayContent.next(newArr);});});
  }else{
    this.like = 1;
      this.publicationsService.likePost(post._id, this.like).subscribe((data) => {
          this.content$
              .pipe(
                  take(1),
                  map((data) => {
                      data[index].likes++;
                      return data;}))
              this.publicationsService.getPublications()
              .subscribe((newArr) => {
                  this.obsArrayContent.next(newArr);
              });
      });
  }}}

onDislike(post: any, index: number) {
  if(post.usersLiked.includes(this.user?._id)){
    console.log('Déja Like')
  }else{
  if(post.usersDisliked.includes(this.user?._id)) {
    console.log('déjà voté')
      this.like = 0;
      this.publicationsService.likePost(post._id, this.like).subscribe((data) => {
          this.content$
              .pipe(
                  take(1),
                  map((data) => {
                      data[index].dislikes--;
                      return data;
                  })
              )
              this.publicationsService.getPublications()
              .subscribe((newArr) => {
                  this.obsArrayContent.next(newArr);
              });
      });
  } else {
    console.log('pas encore voté')
      this.like = -1;
      this.publicationsService.likePost(post._id, this.like).subscribe((data) => {
          this.content$
              .pipe(
                  take(1),
                  map((data) => {
                      data[index].dislikes++;
                      return data;
                  })
              )
              this.publicationsService.getPublications()
              .subscribe((newArr) => {
                  this.obsArrayContent.next(newArr);
              });
      });
  }}}

public onDeletePublication(post: any, index: number): void {
  console.log(post._id, "oui")
  console.log("index", index)
  this.publicationsService.deletePublication(post._id).subscribe(() => {
    this.content$
      .pipe(
        take(1),
        map((data: any) => {
          let newData = [];
          for (let content of data) {
            content.posterId._id !== post.posterId._id ? newData.push(content) : null;
          }
          return newData
        })
      )
      .subscribe((data) => {
        this.obsArrayContent.next(data);
        this.router.navigateByUrl("", { skipLocationChange: true}).then(() => {
          this.router.navigate(["/home"]);
        })
    });
  })
}

public onAddComment(post: any, index: any): void {
  const text = this.commentsForm.get("text")!.value;
  const commenterId = this.user!._id;
  const commenterPseudo = this.user!.pseudo;
  const commenterImage = this.user!.image;
  const postId = post._id;
  this.publicationsService.newComment(postId, text, commenterId, commenterPseudo, commenterImage)
  .subscribe(() => {
    this.content$
      .pipe(
        take(1),
        map((data: any) => {
          let newData = [];
          for (let content of data) {
            content.posterId._id !== post.posterId._id ? newData.push(content) : null;
          }
          return newData
        })
      )
    .subscribe((data) => {
      this.obsArrayContent.next(data);
      this.router.navigateByUrl("", { skipLocationChange: true}).then(() => {
        this.router.navigate(["/home"]);
      })
    })
  }
)}

public onDeleteComment(post: any, comments: any, index: number): void {
  const commentId = comments._id;
  console.log(comments._id, "post")
  console.log("commentId", commentId)
  this.publicationsService.deleteComment(post._id, commentId).subscribe(() => {
    this.content$
      .pipe(
        take(1),
        map((data: any) => {
          let newData = [];
          for (let content of data) {
            content.posterId._id !== post.posterId._id ? newData.push(content) : null;
          }
          return newData
        })
      )
      .subscribe((data) => {
        this.obsArrayContent.next(data);
        this.router.navigateByUrl("", { skipLocationChange: true}).then(() => {
          this.router.navigate(["/home"]);
        })
    });
  })
}
modifyPost(post: any) {
  const dialogConfig = new MatDialogConfig();
  dialogConfig.disableClose = false;
  dialogConfig.autoFocus = true;
  dialogConfig.width = "600px";
  dialogConfig.maxWidth = "80%";
  dialogConfig.data = post;

  this.dialog.open(UpdatePostComponent, dialogConfig);
}
}
